// app/api/subscribe-again/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

/** -------------------------------------------------------
 * Helpers
 * ------------------------------------------------------ */
function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function mustEnv(name: string) {
  const v = (process.env[name] || "").trim();
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function mask(v: string, a = 6, b = 4) {
  v = String(v || "");
  if (!v) return "";
  if (v.length <= a + b) return "*".repeat(v.length);
  return `${v.slice(0, a)}***${v.slice(-b)}`;
}

function squareBaseUrl() {
  const env = (process.env.SQUARE_ENVIRONMENT || "sandbox").toLowerCase();
  return env === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function safeJsonParse(raw: string): { ok: true; data: any } | { ok: false; reason: string } {
  const trimmed = (raw || "").trim();
  if (!trimmed) return { ok: true, data: {} };

  if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html") || trimmed.startsWith("<")) {
    return { ok: false, reason: "PHP returned HTML (likely an error page / redirect / WAF)." };
  }
  if (/^(fatal error|parse error|warning|notice)\b/i.test(trimmed)) {
    return { ok: false, reason: "PHP returned plain-text error output (fatal/warning/notice)." };
  }

  try {
    return { ok: true, data: JSON.parse(trimmed) };
  } catch {
    const first = trimmed.indexOf("{");
    const last = trimmed.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      const candidate = trimmed.slice(first, last + 1);
      try {
        return { ok: true, data: JSON.parse(candidate) };
      } catch {
        // fallthrough
      }
    }
    return { ok: false, reason: "Response is not valid JSON (and cannot be salvaged)." };
  }
}

const PHP_API_URL = (process.env.PHP_API_URL || "").trim();

type PhpResult = {
  http_ok: boolean;
  status: number;
  data: any;
  raw: string;
  contentType: string;
  parse_ok: boolean;
  parse_reason?: string;
};

async function callPhp(payload: Record<string, any>): Promise<PhpResult> {
  if (!PHP_API_URL) throw new Error("PHP_API_URL is not configured.");

  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined || v === null) continue;
    form.append(k, String(v));
  }

  console.log("➡️ PHP SEND", {
    url: PHP_API_URL,
    action: payload?.action,
    payload: {
      ...payload,
      auth_token: payload.auth_token ? mask(payload.auth_token) : undefined,
    },
    encodedPreview: form.toString().slice(0, 350),
  });

  let resp: Response;
  let raw = "";
  let contentType = "";

  try {
    resp = await fetch(PHP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Accept: "application/json, text/plain, */*",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      body: form.toString(),
      cache: "no-store",
    });
    contentType = resp.headers.get("content-type") || "";
    raw = await resp.text();
  } catch (e: any) {
    console.error("❌ PHP FETCH FAILED", e?.message || e);
    return {
      http_ok: false,
      status: 0,
      data: { ok: false, message: "Failed to reach PHP endpoint.", error: e?.message || String(e) },
      raw: "",
      contentType: "",
      parse_ok: true,
    };
  }

  console.log("⬅️ PHP RECV", {
    action: payload?.action,
    status: resp.status,
    ok: resp.ok,
    contentType,
    rawPreview: raw.slice(0, 700),
  });

  const parsed = safeJsonParse(raw);

  if (!parsed.ok) {
    return {
      http_ok: resp.ok,
      status: resp.status,
      data: {
        ok: false,
        message: "Non-JSON response from PHP.",
        _non_json: true,
        _reason: parsed.reason,
        contentType,
        raw_preview: raw.trim().slice(0, 2000),
      },
      raw,
      contentType,
      parse_ok: false,
      parse_reason: parsed.reason,
    };
  }

  return {
    http_ok: resp.ok,
    status: resp.status,
    data: parsed.data,
    raw,
    contentType,
    parse_ok: true,
  };
}

type SquareResp = { ok: boolean; status: number; data: any };

async function squarePost(path: string, body: any): Promise<SquareResp> {
  const accessToken = mustEnv("SQUARE_ACCESS_TOKEN");
  const squareVersion = (process.env.SQUARE_VERSION || "2025-10-16").trim();
  const url = `${squareBaseUrl()}${path}`;

  console.log("➡️ SQUARE SEND", {
    endpoint: `POST ${url}`,
    bodyPreview: JSON.stringify(body).slice(0, 450),
  });

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": squareVersion,
    },
    body: JSON.stringify(body),
  });

  const data = await resp.json().catch(() => ({}));

  console.log("⬅️ SQUARE RECV", {
    endpoint: `POST ${url}`,
    status: resp.status,
    ok: resp.ok,
    errors: data?.errors,
  });

  return { ok: resp.ok, status: resp.status, data };
}

/** -------------------------------------------------------
 * Square helpers for subscribe-again
 * ------------------------------------------------------ */
async function squareCreateCardOnFile(args: { customer_id: string; sourceId: string }) {
  const body = {
    idempotency_key: randomUUID(),
    source_id: args.sourceId,
    card: { customer_id: args.customer_id },
  };

  console.log("➡️ SQUARE CARD CREATE", {
    customer_id: mask(args.customer_id),
    sourceId: mask(args.sourceId),
  });

  return await squarePost("/v2/cards", body);
}

async function squareCreateOrderTemplate(args: {
  location_id: string;
  amount_cents: number;
  title: string;
  currency?: string;
}) {
  const currency = (args.currency || "USD").trim();

  const body = {
    idempotency_key: randomUUID(),
    order: {
      location_id: args.location_id,
      state: "DRAFT",
      line_items: [
        {
          name: args.title,
          quantity: "1",
          base_price_money: { amount: args.amount_cents, currency },
        },
      ],
    },
  };

  console.log("➡️ SQUARE ORDER CREATE", {
    location_id: args.location_id,
    amount_cents: args.amount_cents,
    currency,
    title: args.title,
  });

  return await squarePost("/v2/orders", body);
}

async function squareCreateSubscription(args: {
  customer_id: string;
  location_id: string;
  plan_variation_id: string;
  idempotency_key: string;
  card_id: string;
  order_template_id: string;
}) {
  const body: any = {
    idempotency_key: args.idempotency_key,
    location_id: args.location_id,
    customer_id: args.customer_id,
    plan_variation_id: args.plan_variation_id,
    card_id: args.card_id,
    phases: [{ ordinal: 0, order_template_id: args.order_template_id }],
  };

  console.log("➡️ SQUARE SUB CREATE", {
    env: process.env.SQUARE_ENVIRONMENT || "sandbox",
    location_id: args.location_id,
    customer_id: mask(args.customer_id),
    plan_variation_id: mask(args.plan_variation_id),
    card_id: mask(args.card_id),
  });

  return await squarePost("/v2/subscriptions", body);
}

function pickSubscriptionFields(sub: any) {
  const subscription_id = String(sub?.id || "").trim();
  const status = String(sub?.status || "").trim();
  const start_date = String(sub?.start_date || "").trim();
  const next_billing_date = String(sub?.charged_through_date || sub?.next_billing_date || "").trim();
  return { subscription_id, status, start_date, next_billing_date };
}

/** -------------------------------------------------------
 * GET /api/subscribe-again
 * - Calls PHP action=subscribe-again and returns it as-is.
 * ------------------------------------------------------ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const auth_token = (searchParams.get("auth_token") || "").trim();
    const user_id = (searchParams.get("user_id") || "").trim();
    const return_url = (searchParams.get("return_url") || "").trim();

    console.log("📥 GET /api/subscribe-again", {
      user_id,
      auth_token: mask(auth_token),
      return_url,
    });

    if (!auth_token || !user_id) {
      return json(400, { ok: false, message: "auth_token and user_id are required." });
    }

    const php = await callPhp({
      action: "subscribe-again",
      auth_token,
      user_id,
      return_url,
    });

    if (!php.parse_ok) {
      return json(502, {
        ok: false,
        message: "PHP returned non-JSON output.",
        php_status: php.status,
        php_reason: php.parse_reason,
        contentType: php.contentType,
        php_preview: (php.raw || "").trim().slice(0, 1500),
      });
    }

    if (!php.http_ok) {
      return json(502, {
        ok: false,
        message: "PHP API request failed.",
        php_status: php.status,
        php_preview: (php.raw || "").trim().slice(0, 700),
      });
    }

    if (!php.data?.ok) {
      return json(400, {
        ok: false,
        message: php.data?.message || "Failed to load context.",
      });
    }

    return json(200, php.data);
  } catch (e: any) {
    console.error("❌ GET /api/subscribe-again error:", e);
    return json(500, { ok: false, message: e?.message || "Server error." });
  }
}

/** -------------------------------------------------------
 * POST /api/subscribe-again
 * - Validates plan_variation_id against server-side PHP context.
 * - Looks up square_customer_id via PHP auth-token-lookup.
 * - Creates card-on-file from sourceId.
 * - Creates DRAFT order template for amount.
 * - Creates subscription with phases and card_id.
 * - DOES NOT call subscription-updated (webhooks will handle DB syncing).
 * ------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const auth_token = String(body?.auth_token || "").trim();
    const user_id_from_client = String(body?.user_id || "").trim();
    const plan_variation_id = String(body?.plan_variation_id || "").trim();

    const sourceId = String(body?.sourceId || "").trim();
    const return_url = String(body?.return_url || "").trim();

    console.log("📥 POST /api/subscribe-again body", {
      user_id: user_id_from_client,
      auth_token: auth_token ? mask(auth_token) : "",
      plan_variation_id: plan_variation_id ? mask(plan_variation_id) : "",
      sourceId: sourceId ? mask(sourceId) : "",
      return_url,
    });

    if (!auth_token || !user_id_from_client || !plan_variation_id) {
      return json(400, { ok: false, message: "auth_token, user_id, plan_variation_id are required." });
    }
    if (!sourceId) {
      return json(400, { ok: false, message: "sourceId is required." });
    }

    // 1) Get authoritative packages + course_id from PHP (for server-side validation)
    const ctx = await callPhp({
      action: "subscribe-again",
      auth_token,
      user_id: user_id_from_client,
      return_url,
    });

    if (!ctx.parse_ok) {
      return json(502, {
        ok: false,
        message: "PHP returned non-JSON output (subscribe-again).",
        php_status: ctx.status,
        php_reason: ctx.parse_reason,
        contentType: ctx.contentType,
        php_preview: (ctx.raw || "").trim().slice(0, 2000),
      });
    }
    if (!ctx.http_ok) {
      return json(502, {
        ok: false,
        message: "PHP API request failed (subscribe-again).",
        php_status: ctx.status,
        php_preview: (ctx.raw || "").trim().slice(0, 700),
      });
    }
    if (!ctx.data?.ok) {
      return json(400, { ok: false, message: ctx.data?.message || "Failed to load subscribe-again context." });
    }

    const course_id = String(ctx.data?.course?.course_id || "").trim();
    if (!course_id) {
      return json(500, { ok: false, message: "Missing course_id from PHP context." });
    }

    const pkgs: any[] = Array.isArray(ctx.data?.packages) ? ctx.data.packages : [];
    const picked = pkgs.find((p) => String(p?.plan_variation_id || "").trim() === plan_variation_id);

    if (!picked) {
      return json(400, { ok: false, message: "Invalid plan_variation_id (not found in available packages)." });
    }

    const amount_cents = Number(picked?.amount_cents || 0);
    if (!Number.isFinite(amount_cents) || amount_cents <= 0) {
      return json(400, { ok: false, message: "Invalid package amount from server context." });
    }

    const currency = String(picked?.currency || "USD").trim() || "USD";

    // 2) Validate auth token and get Square customer id (required to create card-on-file / subscription)
    const who = await callPhp({ action: "auth-token-lookup", auth_token });

    if (!who.parse_ok) {
      return json(502, {
        ok: false,
        message: "PHP returned non-JSON output (auth-token-lookup).",
        php_status: who.status,
        php_reason: who.parse_reason,
        contentType: who.contentType,
        php_preview: (who.raw || "").trim().slice(0, 2000),
      });
    }
    if (!who.http_ok) {
      return json(502, {
        ok: false,
        message: "PHP API request failed (auth-token-lookup).",
        php_status: who.status,
        php_preview: (who.raw || "").trim().slice(0, 700),
      });
    }
    if (!who.data?.ok || !who.data?.user?.user_id) {
      return json(401, { ok: false, message: who.data?.message || "Invalid auth token." });
    }

    const user_id = String(who.data.user.user_id || "").trim();
    if (user_id !== user_id_from_client) {
      return json(401, { ok: false, message: "Token/user mismatch." });
    }

    const square_customer_id = String(who.data.user.square_customer_id || "").trim();
    if (!square_customer_id) {
      return json(400, { ok: false, message: "Missing square_customer_id for this user." });
    }

    // 3) Create card-on-file
    const cardRes = await squareCreateCardOnFile({ customer_id: square_customer_id, sourceId });
    if (!cardRes.ok) {
      return json(400, {
        ok: false,
        message: "Square card-on-file creation failed.",
        square_status: cardRes.status,
        square_errors: cardRes.data?.errors || [],
        square_raw: cardRes.data,
      });
    }

    const card_id = String(cardRes.data?.card?.id || "").trim();
    if (!card_id) return json(500, { ok: false, message: "Square returned no card id." });

    // 4) Create DRAFT order template (used by phases)
    const location_id = mustEnv("SQUARE_LOCATION_ID");
    const title = String(picked?.title || "Subscription").trim() || "Subscription";

    const orderRes = await squareCreateOrderTemplate({ location_id, amount_cents, title, currency });
    if (!orderRes.ok) {
      return json(400, {
        ok: false,
        message: "Square order template creation failed.",
        square_status: orderRes.status,
        square_errors: orderRes.data?.errors || [],
        square_raw: orderRes.data,
      });
    }

    const order_template_id = String(orderRes.data?.order?.id || "").trim();
    if (!order_template_id) return json(500, { ok: false, message: "Square returned no order id." });

    // 5) Create subscription
    const sq = await squareCreateSubscription({
      customer_id: square_customer_id,
      location_id,
      plan_variation_id,
      idempotency_key: randomUUID(),
      card_id,
      order_template_id,
    });

    if (!sq.ok) {
      return json(400, {
        ok: false,
        message: "Square subscription creation failed.",
        square_status: sq.status,
        square_errors: sq.data?.errors || [],
        square_raw: sq.data,
        env: process.env.SQUARE_ENVIRONMENT || "sandbox",
        location_id,
        plan_variation_id,
      });
    }

    const sub = sq.data?.subscription || {};
    const { subscription_id, status, start_date, next_billing_date } = pickSubscriptionFields(sub);
    if (!subscription_id) return json(500, { ok: false, message: "Square returned no subscription id." });

    // ✅ Done. DB syncing will happen via your webhook routes:
    // - app/api/subscription-webhook
    // - app/api/payment-webhook

    return json(200, {
      ok: true,
      message: "Subscription created successfully.",
      subscription_id,
      status,
      start_date,
      next_billing_date,
      back_to_portal: return_url || null,
      selected: {
        session_id: picked?.session_id ?? null,
        title: picked?.title ?? "",
        price: picked?.price ?? (amount_cents / 100).toFixed(2),
        amount_cents,
        plan_variation_id,
        currency,
      },
      square: {
        customer_id: square_customer_id,
        card_id,
        order_template_id,
      },
    });
  } catch (e: any) {
    console.error("❌ POST /api/subscribe-again error:", e);
    return json(500, { ok: false, message: e?.message || "Server error." });
  }
}