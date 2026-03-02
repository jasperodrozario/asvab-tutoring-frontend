// app/api/resume-subscription/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Payload = {
  subscription_id?: string;
  user_id?: number | string;
};

function mask(v: string, a = 6, b = 6) {
  v = String(v || "");
  if (!v) return "";
  if (v.length <= a + b) return "*".repeat(v.length);
  return `${v.slice(0, a)}***${v.slice(-b)}`;
}

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function getBaseUrl() {
  const env = (process.env.SQUARE_ENVIRONMENT || "sandbox").toLowerCase();
  return env === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
}

async function squareFetch(path: string, init: RequestInit) {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${path}`;

  const squareVersion = (process.env.SQUARE_VERSION || "2025-10-16").trim();
  const token = (process.env.SQUARE_ACCESS_TOKEN || "").trim();

  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("Square-Version", squareVersion);
  headers.set("Authorization", `Bearer ${token}`);

  console.log("[resume-subscription] -> Square", {
    method: init.method || "GET",
    url,
    squareVersion,
    env: (process.env.SQUARE_ENVIRONMENT || "sandbox").toLowerCase(),
    tokenPresent: Boolean(token),
  });

  const res = await fetch(url, { ...init, headers });
  const text = await res.text();

  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }

  console.log("[resume-subscription] <- Square", {
    url,
    status: res.status,
    ok: res.ok,
    bodyPreview: typeof data === "object" ? JSON.stringify(data).slice(0, 900) : String(data).slice(0, 900),
  });

  return { res, data };
}

export async function POST(req: NextRequest) {
  console.log("[resume-subscription] Incoming", {
    method: req.method,
    url: req.url,
    contentType: req.headers.get("content-type") || "",
    hasInternalKey: Boolean(req.headers.get("x-internal-key")),
  });

  // auth
  const expectedKey = (process.env.INTERNAL_API_SECRET || "").trim();
  const gotKey = (req.headers.get("x-internal-key") || "").trim();

  if (!expectedKey) return json(500, { ok: false, message: "Missing INTERNAL_API_SECRET in env." });
  if (!gotKey || gotKey !== expectedKey) return json(401, { ok: false, message: "Unauthorized." });

  const token = (process.env.SQUARE_ACCESS_TOKEN || "").trim();
  if (!token) return json(500, { ok: false, message: "Missing SQUARE_ACCESS_TOKEN in env." });

  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch (e: any) {
    console.log("[resume-subscription] Bad JSON", { error: String(e?.message || e) });
    return json(400, { ok: false, message: "Invalid JSON body." });
  }

  const subscriptionId = String(payload.subscription_id || "").trim();
  if (!subscriptionId) return json(400, { ok: false, message: "Missing subscription_id." });

  console.log("[resume-subscription] Payload", {
    subscription_id: mask(subscriptionId),
    user_id: payload.user_id ?? "",
  });

  // 1) Fetch current subscription
  const { res: getRes, data: getData } = await squareFetch(
    `/v2/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: "GET" }
  );

  if (!getRes.ok) {
    const msg = getData?.errors?.[0]?.detail || "Failed to fetch subscription.";
    return json(getRes.status || 400, { ok: false, message: msg, square: getData });
  }

  const sub = getData?.subscription;
  const status = String(sub?.status || "").toUpperCase();
  const canceledDate = sub?.canceled_date; // may exist if scheduled cancel/end
  const nextBillingDate = sub?.next_billing_date || "";

  console.log("[resume-subscription] Current subscription state", {
    status,
    canceled_date: canceledDate || "",
    next_billing_date: nextBillingDate || "",
  });

  // 2) If PAUSED/DEACTIVATED, use /resume (Square requirement)
  if (status === "PAUSED" || status === "DEACTIVATED") {
    const { res: resumeRes, data: resumeData } = await squareFetch(
      `/v2/subscriptions/${encodeURIComponent(subscriptionId)}/resume`,
      { method: "POST", body: JSON.stringify({}) }
    );

    if (!resumeRes.ok) {
      const msg = resumeData?.errors?.[0]?.detail || "Square resume failed.";
      return json(resumeRes.status || 400, { ok: false, message: msg, square: resumeData });
    }

    // re-fetch for updated dates
    const { res: refRes, data: refData } = await squareFetch(
      `/v2/subscriptions/${encodeURIComponent(subscriptionId)}`,
      { method: "GET" }
    );

    const sub2 = refData?.subscription;
    const out = {
      ok: true,
      message: "Subscription resumed successfully.",
      status: String(sub2?.status || "ACTIVE").toUpperCase(),
      next_billing_date: String(sub2?.next_billing_date || ""),
      cancel_effective_date: String(sub2?.canceled_date || ""),
      subscription_id: subscriptionId,
    };

    console.log("[resume-subscription] Response to PHP", { ...out, subscription_id: mask(subscriptionId) });
    return json(200, out);
  }

  // 3) Otherwise: treat as “undo cancel” by clearing canceled_date (if present)
  // If there's no canceled_date, it's not in a cancel-scheduled state.
  if (!canceledDate) {
    return json(400, {
      ok: false,
      message:
        "This subscription is not paused/deactivated and has no scheduled cancellation to undo.",
    });
  }

  // Square uses optimistic concurrency on some objects via `version`.
  // Subscription object includes `version` in many cases—use it if present.
  const version = sub?.version;

  const updateBody: any = {
    subscription: {
      id: subscriptionId,
      // Clear scheduled cancellation
      canceled_date: null,
    },
  };

  // Include version if present (safer)
  if (typeof version === "number") {
    updateBody.subscription.version = version;
  }

  console.log("[resume-subscription] Sending PUT to clear canceled_date", {
    subscription_id: mask(subscriptionId),
    hasVersion: typeof version === "number",
  });

  const { res: putRes, data: putData } = await squareFetch(
    `/v2/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { method: "PUT", body: JSON.stringify(updateBody) }
  );

  if (!putRes.ok) {
    const msg = putData?.errors?.[0]?.detail || "Failed to undo cancellation.";
    return json(putRes.status || 400, { ok: false, message: msg, square: putData });
  }

  const subUpdated = putData?.subscription;

  const out = {
    ok: true,
    message: "Cancellation removed and subscription restored.",
    status: String(subUpdated?.status || "ACTIVE").toUpperCase(),
    next_billing_date: String(subUpdated?.next_billing_date || ""),
    cancel_effective_date: String(subUpdated?.canceled_date || ""),
    subscription_id: subscriptionId,
  };

  console.log("[resume-subscription] Response to PHP", { ...out, subscription_id: mask(subscriptionId) });
  return json(200, out);
}