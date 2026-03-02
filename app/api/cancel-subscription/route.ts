import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function safeJsonParse(text: string) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text };
  }
}

function nowIso() {
  return new Date().toISOString();
}

function pickReqMeta(req: NextRequest) {
  // Be careful not to log secrets.
  const contentType = req.headers.get("content-type") || "";
  const userAgent = req.headers.get("user-agent") || "";
  const forwardedFor =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "";
  const host = req.headers.get("host") || "";
  const origin = req.headers.get("origin") || "";
  const referer = req.headers.get("referer") || "";

  return { contentType, userAgent, forwardedFor, host, origin, referer };
}

/**
 * Shared-secret auth between PHP server and Next.js server
 *
 * PHP/cURL sends:  X-Internal-Key: <secret>
 * Next.js expects: INTERNAL_API_SECRET=<secret>
 */
function verifyInternalSecret(req: NextRequest) {
  const provided = (req.headers.get("x-internal-key") || "").trim();
  const expected = (process.env.INTERNAL_API_SECRET || "").trim();

  // Log presence only (never log the secret itself)
  console.log(`[cancel-subscription] ${nowIso()} auth header present:`, !!provided);
  console.log(`[cancel-subscription] ${nowIso()} env INTERNAL_API_SECRET present:`, !!expected);

  return !!expected && !!provided && provided === expected;
}

async function squareFetch(path: string, init?: RequestInit) {
  const accessToken = mustEnv("SQUARE_ACCESS_TOKEN");
  const version = mustEnv("SQUARE_VERSION"); // e.g. "2026-01-22"
  const env = (process.env.SQUARE_ENVIRONMENT || "sandbox").toLowerCase();
  const base = env === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";

  const url = base + path;

  // Log outbound request metadata (safe)
  console.log(`[cancel-subscription] ${nowIso()} -> Square request`, {
    method: init?.method || "GET",
    url,
    squareVersion: version,
    environment: env,
    hasBody: !!init?.body,
  });

  const started = Date.now();
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Square-Version": version,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const durationMs = Date.now() - started;
  const text = await res.text();
  const data = safeJsonParse(text);

  // Log inbound response metadata (safe)
  console.log(`[cancel-subscription] ${nowIso()} <- Square response`, {
    url,
    status: res.status,
    ok: res.ok,
    durationMs,
    // log a small, safe slice of errors if present
    squareErrors: Array.isArray((data as any)?.errors)
      ? (data as any).errors.map((e: any) => ({
          code: e?.code,
          category: e?.category,
          detail: e?.detail,
        }))
      : undefined,
  });

  return { ok: res.ok, status: res.status, data };
}

export async function POST(req: NextRequest) {
  const reqId =
    (globalThis.crypto?.randomUUID?.() ?? `req_${Date.now()}_${Math.random().toString(16).slice(2)}`);

  console.log(`\n[cancel-subscription] ${nowIso()} START`, { reqId, ...pickReqMeta(req) });

  try {
    if (!verifyInternalSecret(req)) {
      console.log(`[cancel-subscription] ${nowIso()} END unauthorized`, { reqId });
      return json(401, { ok: false, message: "Unauthorized" });
    }

    const body = await req.json().catch((err) => {
      console.log(`[cancel-subscription] ${nowIso()} req.json() failed`, {
        reqId,
        error: String(err?.message || err),
      });
      return {};
    });

    // Log what we received (safe, do not log secrets)
    console.log(`[cancel-subscription] ${nowIso()} received body`, {
      reqId,
      keys: body && typeof body === "object" ? Object.keys(body) : [],
      subscription_id_present: !!body?.subscription_id,
      user_id: body?.user_id ?? "",
      cancel_reason_len: typeof body?.cancel_reason === "string" ? body.cancel_reason.length : 0,
    });

    const subscription_id = String(body?.subscription_id || "").trim();
    const cancel_reason = String(body?.cancel_reason || "").trim();
    const user_id = String(body?.user_id || "").trim();

    if (!subscription_id) {
      console.log(`[cancel-subscription] ${nowIso()} END missing subscription_id`, { reqId });
      return json(400, { ok: false, message: "Missing subscription_id" });
    }
    if (!cancel_reason) {
      console.log(`[cancel-subscription] ${nowIso()} END missing cancel_reason`, { reqId, subscription_id });
      return json(400, { ok: false, message: "Missing cancel_reason" });
    }

    // 1) Cancel subscription
    const cancelPath = `/v2/subscriptions/${encodeURIComponent(subscription_id)}/cancel`;
    const cancelRes = await squareFetch(cancelPath, {
      method: "POST",
      body: JSON.stringify({}),
    });

    if (!cancelRes.ok) {
      const out = {
        ok: false,
        message: "Square cancel failed",
        subscription_id,
        user_id,
        square: cancelRes.data,
      };

      console.log(`[cancel-subscription] ${nowIso()} sending response`, {
        reqId,
        status: cancelRes.status,
        ok: out.ok,
        message: out.message,
        subscription_id,
      });

      return json(cancelRes.status, out);
    }

    // 2) Fetch subscription to determine effective date
    const getPath = `/v2/subscriptions/${encodeURIComponent(subscription_id)}`;
    const getRes = await squareFetch(getPath, { method: "GET" });

    if (!getRes.ok) {
      const out = {
        ok: false,
        message: "Square fetch subscription failed",
        subscription_id,
        user_id,
        square: getRes.data,
      };

      console.log(`[cancel-subscription] ${nowIso()} sending response`, {
        reqId,
        status: getRes.status,
        ok: out.ok,
        message: out.message,
        subscription_id,
      });

      return json(getRes.status, out);
    }

    const sub = getRes.data?.subscription || {};
    const chargedThrough = String(sub.charged_through_date || "").trim(); // YYYY-MM-DD
    const nextBilling = String(sub.next_billing_date || "").trim(); // fallback
    const squareStatus = String(sub.status || "").trim();

    const cancel_effective_date = chargedThrough || nextBilling || "";
    const status = cancel_effective_date ? "CANCEL_PENDING" : (squareStatus || "CANCEL_PENDING");

    const out = {
      ok: true,
      message: "Cancellation requested",
      subscription_id,
      user_id,
      status,
      square_status: squareStatus,
      cancel_effective_date,
      cancel_reason, // safe to return; already user-provided
    };

    console.log(`[cancel-subscription] ${nowIso()} sending response`, {
      reqId,
      status: 200,
      ok: out.ok,
      message: out.message,
      subscription_id,
      user_id,
      square_status: squareStatus,
      cancel_effective_date,
      mapped_status: status,
    });

    console.log(`[cancel-subscription] ${nowIso()} END`, { reqId, ok: true });

    return json(200, out);
  } catch (e: any) {
    console.log(`[cancel-subscription] ${nowIso()} ERROR`, {
      reqId,
      message: String(e?.message || e),
      stack: e?.stack ? String(e.stack).slice(0, 2000) : undefined,
    });

    const out = { ok: false, message: e?.message || "Server error" };

    console.log(`[cancel-subscription] ${nowIso()} sending response`, {
      reqId,
      status: 500,
      ok: out.ok,
      message: out.message,
    });

    return json(500, out);
  }
}