// app/api/dispute-webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

/**
 * Square signature = base64(HMAC_SHA256(signatureKey, notificationUrl + rawBody))
 * - Must use RAW body exactly as received.
 * - Must NOT call timingSafeEqual unless lengths match.
 */
function verifySquareSignature(params: {
  signatureKey: string;
  notificationUrl: string;
  rawBody: string;
  signatureHeader: string | null;
}) {
  const signatureHeader = (params.signatureHeader ?? "").trim();
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", params.signatureKey)
    .update(params.notificationUrl + params.rawBody, "utf8")
    .digest("base64");

  // Square sends base64 string; compare as utf8 buffers
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function moneyToDecimal(amountMinor: any): string {
  // Square sends minor units (cents). Example: 8803 => "88.03"
  const n = Number(amountMinor);
  if (!Number.isFinite(n)) return "0.00";
  return (n / 100).toFixed(2);
}

function toMySqlDateTime(iso: any): string {
  // "2026-02-23T14:41:08.488Z" => "2026-02-23 14:41:08" (UTC)
  if (!iso || typeof iso !== "string") return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (x: number) => String(x).padStart(2, "0");
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

function extractDispute(payload: any) {
  const eventType = String(payload?.type || "");
  const event_id = String(payload?.event_id || "");
  const merchant_id = String(payload?.merchant_id || "");
  const location_id = String(payload?.location_id || "");

  // Square dispute payloads: data.object.dispute
  const d = payload?.data?.object?.dispute || null;

  const dispute_id = String(d?.id || "");
  const payment_id = String(d?.disputed_payment?.payment_id || "");

  const amount_minor = d?.amount_money?.amount ?? null;
  const currency = String(d?.amount_money?.currency || "");

  const amount = moneyToDecimal(amount_minor);

  const card_brand = String(d?.card_brand || "");
  const reason = String(d?.reason || "");
  const state = String(d?.state || "");

  const due_at = String(d?.due_at || "");
  const square_created_at = String(d?.created_at || payload?.created_at || "");
  const square_updated_at = String(d?.updated_at || "");

  return {
    eventType,
    event_id,
    merchant_id,
    location_id,

    dispute_id,
    payment_id,

    amount_minor,
    amount,
    currency,

    card_brand,
    reason,
    state,

    due_at,
    square_created_at,
    square_updated_at,

    // MySQL-friendly
    due_at_mysql: toMySqlDateTime(due_at),
    square_created_at_mysql: toMySqlDateTime(square_created_at),
    square_updated_at_mysql: toMySqlDateTime(square_updated_at),
  };
}

async function postToPhp(params: {
  phpUrl: string;
  action: string;
  payload: Record<string, any>;
}) {
  const form = new URLSearchParams();
  form.set("action", params.action);

  for (const [k, v] of Object.entries(params.payload)) {
    if (v === undefined || v === null) continue;
    form.set(k, String(v));
  }

  console.log("[dispute-webhook] -> PHP URL:", params.phpUrl);
  console.log("[dispute-webhook] -> PHP action:", params.action);
  console.log("[dispute-webhook] -> PHP payload:", Object.fromEntries(form.entries()));

  const res = await fetch(params.phpUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    cache: "no-store",
  });

  const text = await res.text();
  console.log("[dispute-webhook] <- PHP status:", res.status);
  console.log("[dispute-webhook] <- PHP body:", text);

  return { status: res.status, body: text };
}

export async function POST(req: NextRequest) {
  // ✅ MUST match your .env
  const signatureKey = process.env.SQUARE_DISPUTE_WEBHOOK_SIGNATURE_KEY || "";
  const notificationUrl = process.env.SQUARE_DISPUTE_WEBHOOK_URL || "";
  const phpUrl = process.env.PHP_API_URL || "";

  // ---- Receive RAW body (required for signature)
  const rawBody = await req.text();
  const signatureHeader = req.headers.get("x-square-hmacsha256-signature");

  console.log("====================================================");
  console.log("[dispute-webhook] Incoming request");
  console.log("[dispute-webhook] Request URL:", req.url);
  console.log("[dispute-webhook] Signature header present:", !!signatureHeader);
  console.log("[dispute-webhook] Raw body:", rawBody);

  if (!signatureKey || !notificationUrl) {
    console.log(
      "[dispute-webhook] Missing env:",
      "SQUARE_DISPUTE_WEBHOOK_SIGNATURE_KEY or SQUARE_DISPUTE_WEBHOOK_URL"
    );
    return NextResponse.json(
      { ok: false, message: "Server misconfigured (missing dispute webhook env)" },
      { status: 500 }
    );
  }

  const okSig = verifySquareSignature({
    signatureKey,
    notificationUrl,
    rawBody,
    signatureHeader,
  });

  console.log("[dispute-webhook] Signature valid:", okSig);

  if (!okSig) {
    return NextResponse.json({ ok: false, message: "Invalid signature" }, { status: 401 });
  }

  // ---- Parse JSON
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    console.log("[dispute-webhook] JSON parse error:", e);
    return NextResponse.json({ ok: false, message: "Invalid JSON" }, { status: 400 });
  }

  console.log("[dispute-webhook] Parsed payload.type:", payload?.type);
  console.log("[dispute-webhook] Parsed event_id:", payload?.event_id);

  // ---- Only handle dispute events here
  const eventType = String(payload?.type || "");
  if (eventType !== "dispute.created" && eventType !== "dispute.state.updated") {
    console.log("[dispute-webhook] Ignored event type:", eventType);
    return NextResponse.json({ ok: true, ignored: true, type: eventType }, { status: 200 });
  }

  const d = extractDispute(payload);

  console.log("[dispute-webhook] Extracted:", d);

  // Safety checks: if Square changes structure, we want logs + avoid bad inserts
  if (!d.dispute_id || !d.payment_id) {
    console.log("[dispute-webhook] Missing dispute_id or payment_id. Full payload:", payload);
    // Return 200 so Square doesn't retry forever, but you have logs to fix quickly.
    return NextResponse.json({ ok: true, warning: "missing_ids" }, { status: 200 });
  }

  // ✅ Match YOUR table columns (lean version)
  // user_id will be resolved in PHP using payment_id -> edu_square_payments.user_id
  const phpPayload = {
    dispute_id: d.dispute_id,
    payment_id: d.payment_id,
    amount: d.amount,
    currency: d.currency,
    card_brand: d.card_brand,
    reason: d.reason,
    state: d.state,
    due_at: d.due_at_mysql,
    square_created_at: d.square_created_at_mysql,
    square_updated_at: d.square_updated_at_mysql,

    // Optional: helps debugging & tracing (PHP can ignore)
    event_id: d.event_id,
    merchant_id: d.merchant_id,
    location_id: d.location_id,
    event_type: d.eventType,
  };

  if (!phpUrl) {
    console.log("[dispute-webhook] PHP_API_URL missing; skipping forward.");
    return NextResponse.json({ ok: true, skipped_php: true, dispute: phpPayload }, { status: 200 });
  }

  // Simplify PHP: one action for both (UPSERT by dispute_id)
  const action = "square-dispute";

  try {
    const phpResult = await postToPhp({ phpUrl, action, payload: phpPayload });

    return NextResponse.json(
      {
        ok: true,
        type: eventType,
        forwarded_to_php: true,
        php_status: phpResult.status,
      },
      { status: 200 }
    );
  } catch (e) {
    console.log("[dispute-webhook] Error calling PHP:", e);
    // Return 200 so Square doesn't keep retrying, but logs show failure.
    return NextResponse.json(
      { ok: true, forwarded: false, message: "PHP call failed (logged)", type: eventType },
      { status: 200 }
    );
  }
}