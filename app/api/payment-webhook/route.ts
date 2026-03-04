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

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Best-effort idempotency (dev). Use DB-level dedupe in PHP for production.
const seenEventIds = new Set<string>();

function safePreviewRaw(raw: string, maxLen = 1200) {
  return raw.length > maxLen ? raw.slice(0, maxLen) + "…(truncated)" : raw;
}

function logKVs(prefix: string, sp: URLSearchParams) {
  console.log(prefix, Object.fromEntries(sp.entries()));
}

async function forwardToPhp(params: { phpUrl: string; action: string; body: URLSearchParams }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    params.body.set("action", params.action);

    console.log("[PaymentWebhook][PHP] preparing request", {
      action: params.action,
      url: params.phpUrl ? "(set)" : "(missing)",
      body_len: params.body.toString().length,
    });
    logKVs("[PaymentWebhook][PHP] fields", params.body);

    const res = await fetch(params.phpUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.body,
      signal: controller.signal,
    });

    const text = await res.text().catch(() => "");
    console.log("[PaymentWebhook][PHP] response", {
      action: params.action,
      status: res.status,
      ok: res.ok,
      body_preview: safePreviewRaw(text, 1200),
    });

    return { ok: res.ok, status: res.status, text };
  } catch (err: any) {
    console.error("[PaymentWebhook][PHP] request error", {
      action: params.action,
      message: err?.message ?? String(err),
      name: err?.name,
    });
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function extractPayment(event: any) {
  const eventType = String(event?.type ?? "");
  const eventId = String(event?.event_id ?? "").trim();
  const eventCreatedAt = String(event?.created_at ?? "");

  const payment = event?.data?.object?.payment ?? null;

  const paymentId = String(payment?.id ?? event?.data?.id ?? "");
  const orderId = String(payment?.order_id ?? "");
  const status = String(payment?.status ?? "");

  const amount = payment?.amount_money?.amount;
  const currency = String(payment?.amount_money?.currency ?? "");

  const squareCustomerId = String(payment?.customer_id ?? "");
  const paymentCreatedAt = String(payment?.created_at ?? "");
  const paymentUpdatedAt = String(payment?.updated_at ?? "");

  const sourceType = String(payment?.source_type ?? "");
  const receiptNumber = String(payment?.receipt_number ?? "");
  const receiptUrl = String(payment?.receipt_url ?? "");

  const cardLast4 = String(payment?.card_details?.card?.last_4 ?? "");
  const cardBrand = String(payment?.card_details?.card?.card_brand ?? "");

  // ✅ NEW: buyer email (present in many payment events)
  const buyerEmailAddress = String(payment?.buyer_email_address ?? "").trim();

  return {
    eventType,
    eventId,
    eventCreatedAt,

    paymentId,
    orderId,
    status,
    amount: amount === undefined || amount === null ? "" : String(amount),
    currency,

    squareCustomerId,
    paymentCreatedAt,
    paymentUpdatedAt,

    sourceType,
    receiptNumber,
    receiptUrl,
    cardLast4,
    cardBrand,

    // ✅ NEW
    buyerEmailAddress,
  };
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");

  console.log("[PaymentWebhook] received", {
    method: req.method,
    headers: {
      "x-square-hmacsha256-signature": signature
        ? signature.slice(0, 12) + "…" + signature.slice(-8)
        : null,
      "content-type": req.headers.get("content-type"),
      "user-agent": req.headers.get("user-agent"),
      "x-forwarded-for": req.headers.get("x-forwarded-for"),
    },
    rawBodyLen: rawBody.length,
    rawBodyPreview: safePreviewRaw(rawBody, 1000),
  });

  const signatureKey = process.env.SQUARE_PAYMENT_WEBHOOK_SIGNATURE_KEY;
  const notificationUrl = process.env.SQUARE_PAYMENT_WEBHOOK_URL;
  const phpUrl = process.env.PHP_API_URL;

  if (!signatureKey || !notificationUrl) {
    console.error("[PaymentWebhook] missing env", {
      hasSignatureKey: !!signatureKey,
      hasNotificationUrl: !!notificationUrl,
    });
    return NextResponse.json({ ok: false, error: "Webhook env not configured" }, { status: 500 });
  }
  if (!phpUrl) {
    console.error("[PaymentWebhook] missing env", { hasPhpUrl: false });
    return NextResponse.json({ ok: false, error: "PHP_API_URL not configured" }, { status: 500 });
  }

  const isValid = verifySquareSignature({
    signatureKey,
    notificationUrl: notificationUrl.trim(),
    rawBody,
    signatureHeader: signature,
  });

  console.log("[PaymentWebhook] signature check", { isValid });

  if (!isValid) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    console.error("[PaymentWebhook] JSON parse error:", e);
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const type = String(event?.type ?? "");
  const eventId = String(event?.event_id ?? "").trim();
  const eventCreatedAt = String(event?.created_at ?? "");
  const merchantId = String(event?.merchant_id ?? "");
  const locationId = String(event?.location_id ?? "");
  const dataType = String(event?.data?.type ?? "");
  const dataId = String(event?.data?.id ?? "");

  console.log("[PaymentWebhook] parsed event", {
    type,
    eventId,
    eventCreatedAt,
    merchant_id: merchantId,
    location_id: locationId || null,
    data_type: dataType || null,
    data_id: dataId || null,
  });

  if (eventId) {
    if (seenEventIds.has(eventId)) {
      console.log("[PaymentWebhook] dedupe hit, ignoring", { eventId, type });
      return NextResponse.json({ ok: true, deduped: true });
    }
    seenEventIds.add(eventId);
  }

  // Only handle payment events in this route.
  const shouldHandle = type === "payment.updated" || type === "payment.created";
  if (!shouldHandle) {
    console.log("[PaymentWebhook] ignoring unsupported type", { type });
    return NextResponse.json({ ok: true });
  }

  try {
    const p = extractPayment(event);

    console.log("[PaymentWebhook] payment extracted", {
      eventType: p.eventType,
      eventId: p.eventId,
      paymentId: p.paymentId,
      status: p.status,
      orderId: p.orderId,
      squareCustomerId: p.squareCustomerId,
      amount: p.amount,
      currency: p.currency,
      paymentCreatedAt: p.paymentCreatedAt,
      paymentUpdatedAt: p.paymentUpdatedAt,
      sourceType: p.sourceType,
      cardLast4: p.cardLast4,
      cardBrand: p.cardBrand,
      // ✅ NEW
      buyerEmailAddress: p.buyerEmailAddress,
    });

    if (!p.paymentId) {
      console.log("[PaymentWebhook] missing payment_id, ignoring");
      return NextResponse.json({ ok: true });
    }

    const body = new URLSearchParams();
    body.set("event_id", p.eventId);
    body.set("event_type", p.eventType);
    body.set("event_created_at", p.eventCreatedAt);

    body.set("payment_id", p.paymentId);

    if (p.orderId) body.set("order_id", p.orderId);
    if (p.status) body.set("payment_status", p.status);

    // amount is in smallest currency unit (e.g., cents)
    if (p.amount !== "") body.set("amount", p.amount);
    if (p.currency) body.set("currency", p.currency);

    if (p.squareCustomerId) body.set("square_customer_id", p.squareCustomerId);
    if (p.paymentCreatedAt) body.set("payment_created_at", p.paymentCreatedAt);
    if (p.paymentUpdatedAt) body.set("payment_updated_at", p.paymentUpdatedAt);

    // ✅ NEW: forward email to PHP
    if (p.buyerEmailAddress) {
      body.set("email", p.buyerEmailAddress);              // your PHP can read $_POST['email']
      body.set("buyer_email_address", p.buyerEmailAddress); // optional (safe)
    }

    // Optional debug fields (safe to ignore in PHP)
    if (p.sourceType) body.set("source_type", p.sourceType);
    if (p.receiptNumber) body.set("receipt_number", p.receiptNumber);
    if (p.receiptUrl) body.set("receipt_url", p.receiptUrl);
    if (p.cardLast4) body.set("card_last_4", p.cardLast4);
    if (p.cardBrand) body.set("card_brand", p.cardBrand);

    const result = await forwardToPhp({ phpUrl, action: "payment-updated-webhook", body });
    if (!result.ok) console.error("[PaymentWebhook] PHP payment handler failed:", result.status);
  } catch (err) {
    console.error("[PaymentWebhook] route error:", err);
  }

  return NextResponse.json({ ok: true });
}