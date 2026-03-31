// app/api/subscribe-again/route.ts
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";

/** -------------------------------------------------------
 * Helpers
 * ------------------------------------------------------ */
function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function safeStr(v: unknown, max = 800) {
  const s = String(v ?? "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function safeJsonParse(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function squareBaseUrl() {
  const env = safeStr(process.env.SQUARE_ENVIRONMENT || "sandbox", 20).toLowerCase();
  return env === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

/**
 * Parse PHP response safely.
 * - Never echo raw HTML/errors back to client.
 * - If response is not JSON, return null and handle with a friendly message.
 */
function parsePhpJson(raw: string) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return { ok: true as const, data: {} };

  if (trimmed.startsWith("<!doctype") || trimmed.startsWith("<html") || trimmed.startsWith("<")) {
    return { ok: false as const, reason: "non_json_html" };
  }
  if (/^(fatal error|parse error|warning|notice)\b/i.test(trimmed)) {
    return { ok: false as const, reason: "non_json_php_error" };
  }

  const direct = safeJsonParse(trimmed);
  if (direct) return { ok: true as const, data: direct };

  // try salvage JSON inside extra text
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    const candidate = trimmed.slice(first, last + 1);
    const salvaged = safeJsonParse(candidate);
    if (salvaged) return { ok: true as const, data: salvaged };
  }

  return { ok: false as const, reason: "non_json_unknown" };
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number
) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

const PHP_API_URL = safeStr(process.env.NEXT_PUBLIC_PHP_API_URL || "", 800);

type PhpResult = {
  http_ok: boolean;
  status: number;
  data: any;
  parse_ok: boolean;
};

async function callPhp(payload: Record<string, any>): Promise<PhpResult> {
  if (!PHP_API_URL) {
    return { http_ok: false, status: 500, data: null, parse_ok: false };
  }

  const form = new URLSearchParams();
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined || v === null) continue;
    form.append(k, String(v));
  }

  try {
    const resp = await fetchWithTimeout(
      PHP_API_URL,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          Accept: "application/json, text/plain, */*",
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        body: form.toString(),
        cache: "no-store",
      },
      20_000
    );

    const raw = await resp.text().catch(() => "");
    const parsed = parsePhpJson(raw);

    if (!parsed.ok) {
      return {
        http_ok: resp.ok,
        status: resp.status,
        data: null,
        parse_ok: false,
      };
    }

    return {
      http_ok: resp.ok,
      status: resp.status,
      data: parsed.data,
      parse_ok: true,
    };
  } catch {
    return {
      http_ok: false,
      status: 0,
      data: null,
      parse_ok: false,
    };
  }
}

type SquareResp = { ok: boolean; status: number; data: any; configError?: boolean };

function squareConfig() {
  const accessToken = safeStr(process.env.SQUARE_ACCESS_TOKEN || "", 1200);
  const squareVersion = safeStr(process.env.SQUARE_VERSION || "2026-01-22", 50);
  const locationId = safeStr(process.env.SQUARE_LOCATION_ID || "", 120);

  if (!accessToken || !squareVersion) {
    return { ok: false as const, accessToken, squareVersion, locationId, configError: true as const };
  }
  return { ok: true as const, accessToken, squareVersion, locationId, configError: false as const };
}

async function squarePost(path: string, body: any): Promise<SquareResp> {
  const cfg = squareConfig();
  if (!cfg.ok) return { ok: false, status: 500, data: null, configError: true };

  const url = `${squareBaseUrl()}${path}`;

  const resp = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.accessToken}`,
        "Square-Version": cfg.squareVersion,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
    20_000
  );

  const text = await resp.text().catch(() => "");
  const data = safeJsonParse(text) ?? {};

  return { ok: resp.ok, status: resp.status, data };
}

/** -------------------------------------------------------
 * Square helpers for subscribe-again
 * ------------------------------------------------------ */
async function squareCreateCardOnFile(args: { customer_id: string; sourceId: string }) {
  const body = {
    idempotency_key: crypto.randomUUID(),
    source_id: args.sourceId,
    card: { customer_id: args.customer_id },
  };
  return await squarePost("/v2/cards", body);
}

async function squareCreateOrderTemplate(args: {
  location_id: string;
  amount_cents: number;
  title: string;
  currency?: string;
}) {
  const currency = safeStr(args.currency || "USD", 10) || "USD";

  const body = {
    idempotency_key: crypto.randomUUID(),
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

  return await squarePost("/v2/subscriptions", body);
}

function pickSubscriptionFields(sub: any) {
  const subscription_id = safeStr(sub?.id || "", 120);
  const status = safeStr(sub?.status || "", 60);
  const start_date = safeStr(sub?.start_date || "", 20);
  const next_billing_date = safeStr(sub?.charged_through_date || sub?.next_billing_date || "", 20);
  return { subscription_id, status, start_date, next_billing_date };
}

/** -------------------------------------------------------
 * GET /api/subscribe-again
 * - Calls PHP action=subscribe-again and returns it.
 * ------------------------------------------------------ */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const auth_token = safeStr(searchParams.get("auth_token") || "", 400);
    const user_id = safeStr(searchParams.get("user_id") || "", 60);
    const return_url = safeStr(searchParams.get("return_url") || "", 800);

    if (!auth_token || !user_id) {
      return json(400, {
        ok: false,
        message: "Please sign in again and try once more.",
      });
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
        message: "We couldn't load your subscription options right now. Please try again shortly.",
      });
    }

    if (!php.http_ok) {
      return json(502, {
        ok: false,
        message: "We couldn't load your subscription options right now. Please try again shortly.",
      });
    }

    if (!php.data?.ok) {
      return json(400, {
        ok: false,
        message: php.data?.message || "We couldn't load your subscription options. Please try again.",
      });
    }

    return json(200, php.data);
  } catch {
    return json(500, {
      ok: false,
      message: "Something went wrong. Please try again.",
    });
  }
}

/** -------------------------------------------------------
 * POST /api/subscribe-again
 * - Validates plan_variation_id against server-side PHP context.
 * - Looks up square_customer_id via PHP auth-token-lookup.
 * - Creates card-on-file from sourceId.
 * - Creates DRAFT order template for amount.
 * - Creates subscription with phases and card_id.
 * - DOES NOT call subscription-updated (webhooks handle DB syncing).
 * ------------------------------------------------------ */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));

    const auth_token = safeStr(body?.auth_token || "", 400);
    const user_id_from_client = safeStr(body?.user_id || "", 60);
    const plan_variation_id = safeStr(body?.plan_variation_id || "", 120);

    const sourceId = safeStr(body?.sourceId || "", 600);
    const return_url = safeStr(body?.return_url || "", 800);

    if (!auth_token || !user_id_from_client || !plan_variation_id) {
      return json(400, {
        ok: false,
        message: "Missing required information. Please refresh and try again.",
      });
    }
    if (!sourceId) {
      return json(400, {
        ok: false,
        message: "Payment method is missing. Please refresh and try again.",
      });
    }

    // PHP config safety
    if (!PHP_API_URL) {
      return json(500, {
        ok: false,
        message: "Subscription service is not configured properly. Please contact support.",
      });
    }

    // 1) Server-side validation: load available packages from PHP
    const ctx = await callPhp({
      action: "subscribe-again",
      auth_token,
      user_id: user_id_from_client,
      return_url,
    });

    if (!ctx.parse_ok || !ctx.http_ok || !ctx.data?.ok) {
      return json(502, {
        ok: false,
        message: "We couldn't verify your subscription options right now. Please try again shortly.",
      });
    }

    const course_id = safeStr(ctx.data?.course?.course_id || "", 60);
    if (!course_id) {
      return json(500, {
        ok: false,
        message: "We couldn't prepare your subscription. Please try again.",
      });
    }

    const pkgs: any[] = Array.isArray(ctx.data?.packages) ? ctx.data.packages : [];
    const picked = pkgs.find((p) => safeStr(p?.plan_variation_id || "", 120) === plan_variation_id);

    if (!picked) {
      return json(400, {
        ok: false,
        message: "That subscription option is not available. Please select another plan.",
      });
    }

    const amount_cents = Number(picked?.amount_cents || 0);
    if (!Number.isFinite(amount_cents) || amount_cents <= 0) {
      return json(400, {
        ok: false,
        message: "We couldn't verify the plan price. Please try again.",
      });
    }

    const currency = safeStr(picked?.currency || "USD", 10) || "USD";

    // 2) Validate auth token and get Square customer id
    const who = await callPhp({ action: "auth-token-lookup", auth_token });

    if (!who.parse_ok || !who.http_ok || !who.data?.ok || !who.data?.user?.user_id) {
      return json(401, {
        ok: false,
        message: "Your session has expired. Please sign in again.",
      });
    }

    const user_id = safeStr(who.data.user.user_id || "", 60);
    if (user_id !== user_id_from_client) {
      return json(401, {
        ok: false,
        message: "Your session has expired. Please sign in again.",
      });
    }

    const square_customer_id = safeStr(who.data.user.square_customer_id || "", 140);
    if (!square_customer_id) {
      return json(400, {
        ok: false,
        message: "We couldn't find a payment profile for this account. Please contact support.",
      });
    }

    // 3) Create card-on-file
    const cardRes = await squareCreateCardOnFile({ customer_id: square_customer_id, sourceId });
    if (cardRes.configError) {
      return json(500, {
        ok: false,
        message: "Payment service is not configured properly. Please contact support.",
      });
    }
    if (!cardRes.ok) {
      return json(400, {
        ok: false,
        message:
          "We couldn't save your payment method. Please try again or use a different card.",
      });
    }

    const card_id = safeStr(cardRes.data?.card?.id || "", 120);
    if (!card_id) {
      return json(500, {
        ok: false,
        message: "We couldn't set up your payment method. Please try again.",
      });
    }

    // 4) Create DRAFT order template (used by phases)
    const cfg = squareConfig();
    if (!cfg.ok || !cfg.locationId) {
      return json(500, {
        ok: false,
        message: "Payment service is not configured properly. Please contact support.",
      });
    }
    const location_id = cfg.locationId;

    const title = safeStr(picked?.title || "Subscription", 120) || "Subscription";
    const orderRes = await squareCreateOrderTemplate({ location_id, amount_cents, title, currency });

    if (orderRes.configError) {
      return json(500, {
        ok: false,
        message: "Payment service is not configured properly. Please contact support.",
      });
    }
    if (!orderRes.ok) {
      return json(400, {
        ok: false,
        message:
          "We couldn't prepare your subscription charge. Please try again shortly.",
      });
    }

    const order_template_id = safeStr(orderRes.data?.order?.id || "", 120);
    if (!order_template_id) {
      return json(500, {
        ok: false,
        message: "We couldn't prepare your subscription. Please try again.",
      });
    }

    // 5) Create subscription
    const subRes = await squareCreateSubscription({
      customer_id: square_customer_id,
      location_id,
      plan_variation_id,
      idempotency_key: crypto.randomUUID(),
      card_id,
      order_template_id,
    });

    if (subRes.configError) {
      return json(500, {
        ok: false,
        message: "Payment service is not configured properly. Please contact support.",
      });
    }

    if (!subRes.ok) {
      return json(400, {
        ok: false,
        message:
          "We couldn't create the subscription. Please try again, or use a different card.",
      });
    }

    const sub = subRes.data?.subscription || {};
    const { subscription_id, status, start_date, next_billing_date } = pickSubscriptionFields(sub);

    if (!subscription_id) {
      return json(500, {
        ok: false,
        message: "We couldn't finalize your subscription. Please contact support.",
      });
    }

    // ✅ Done. DB syncing happens via:
    // - app/api/subscription-webhook
    // - app/api/payment-webhook

    return json(200, {
      ok: true,
      message: "Your subscription has been created successfully.",
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
  } catch {
    return json(500, {
      ok: false,
      message: "We couldn't create your subscription right now. Please try again.",
    });
  }
}