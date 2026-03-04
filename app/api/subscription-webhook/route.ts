// app/api/subscription-webhook/route.ts
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

function squareBaseUrl() {
  const env = (process.env.SQUARE_ENVIRONMENT ?? "sandbox").toLowerCase();
  return env === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function squareHeaders() {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) throw new Error("Missing SQUARE_ACCESS_TOKEN");

  return {
    Authorization: `Bearer ${token}`,
    "Square-Version": "2025-10-16",
    "Content-Type": "application/json",
  } as const;
}

async function fetchInvoice(invoiceId: string) {
  const res = await fetch(
    `${squareBaseUrl()}/v2/invoices/${encodeURIComponent(invoiceId)}`,
    { headers: squareHeaders() }
  );

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`GetInvoice failed ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as { invoice?: any };
  } catch {
    throw new Error(`GetInvoice returned non-JSON ${res.status}: ${text}`);
  }
}

async function fetchPayment(paymentId: string) {
  const res = await fetch(
    `${squareBaseUrl()}/v2/payments/${encodeURIComponent(paymentId)}`,
    { headers: squareHeaders() }
  );

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`GetPayment failed ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as { payment?: any };
  } catch {
    throw new Error(`GetPayment returned non-JSON ${res.status}: ${text}`);
  }
}

async function fetchSubscription(subscriptionId: string) {
  const res = await fetch(
    `${squareBaseUrl()}/v2/subscriptions/${encodeURIComponent(subscriptionId)}`,
    { headers: squareHeaders() }
  );

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`GetSubscription failed ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as { subscription?: any };
  } catch {
    throw new Error(`GetSubscription returned non-JSON ${res.status}: ${text}`);
  }
}

async function searchInvoiceByOrderId(params: { locationId: string; orderId: string }) {
  const body = {
    query: {
      filter: {
        location_ids: [params.locationId],
        order_ids: [params.orderId],
      },
    },
    limit: 1,
  };

  const res = await fetch(`${squareBaseUrl()}/v2/invoices/search`, {
    method: "POST",
    headers: squareHeaders(),
    body: JSON.stringify(body),
  });

  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`SearchInvoices failed ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as { invoices?: any[] };
  } catch {
    throw new Error(`SearchInvoices returned non-JSON ${res.status}: ${text}`);
  }
}

function safeJson(obj: any) {
  try {
    return JSON.stringify(obj);
  } catch {
    return "[unserializable]";
  }
}

function mask(s: string, keepStart = 6, keepEnd = 4) {
  if (!s) return s;
  if (s.length <= keepStart + keepEnd) return "***";
  return `${s.slice(0, keepStart)}…${s.slice(-keepEnd)}`;
}

// YYYY-MM-DD + N days -> YYYY-MM-DD (UTC-safe)
function addDaysYYYYMMDD(dateStr: string, days: number) {
  const s = String(dateStr || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return "";
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/**
 * Square does not provide next_billing_date directly.
 * Compute from charged_through_date + 1 day.
 * Fallback: start_date (useful early lifecycle).
 */
function computeNextBillingDate(sub: any) {
  const chargedThrough = String(sub?.charged_through_date ?? "").trim(); // YYYY-MM-DD
  if (chargedThrough) return addDaysYYYYMMDD(chargedThrough, 1);

  const startDate = String(sub?.start_date ?? "").trim(); // YYYY-MM-DD
  return startDate || "";
}

/**
 * POST to your PHP backend
 */
async function postToPhp(action: string, fields: Record<string, string>) {
  const url = process.env.PHP_API_URL;

  if (!url) {
    console.warn("[PHP] Missing env PHP_API_URL; skipping PHP call", { action });
    return { ok: false, skipped: true as const };
  }

  const form = new URLSearchParams();
  form.set("action", action);
  for (const [k, v] of Object.entries(fields)) form.set(k, v);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  const bodyText = await res.text().catch(() => "");

  if (!res.ok) {
    throw new Error(`PHP call failed (${action}) ${res.status}: ${bodyText}`);
  }

  return { ok: true as const, status: res.status, bodyText };
}

/**
 * NOTE: For real idempotency, store event_id in DB (recommended).
 */
const seenEventIds = new Set<string>();

function getEventType(event: any) {
  return String(event?.type ?? "").trim();
}
function getEventId(event: any) {
  return String(event?.event_id ?? "").trim();
}
function getEventCreatedAt(event: any) {
  return String(event?.created_at ?? "").trim();
}

function getSubscriptionFromEvent(event: any) {
  return event?.data?.object?.subscription ?? event?.data?.object ?? null;
}
function getSubscriptionId(event: any) {
  return (
    String(event?.data?.id ?? "").trim() ||
    String(event?.data?.object?.subscription?.id ?? "").trim() ||
    String(event?.data?.object?.id ?? "").trim() ||
    ""
  );
}

function getInvoiceFromEvent(event: any) {
  return event?.data?.object?.invoice ?? event?.data?.object ?? null;
}
function getInvoiceId(event: any) {
  return (
    String(event?.data?.id ?? "").trim() ||
    String(event?.data?.object?.invoice?.id ?? "").trim() ||
    String(event?.data?.object?.invoice_id ?? "").trim() ||
    String(event?.data?.object?.id ?? "").trim() ||
    ""
  );
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  // ✅ must be raw text for HMAC
  const rawBody = await req.text();
  const signature = req.headers.get("x-square-hmacsha256-signature");

  const signatureKey = process.env.SQUARE_SUBSCRIPTION_WEBHOOK_SIGNATURE_KEY;
  const notificationUrl = process.env.SQUARE_SUBSCRIPTION_WEBHOOK_URL;

  if (!signatureKey || !notificationUrl) {
    console.error("[Webhook] Missing env", {
      hasKey: !!signatureKey,
      hasUrl: !!notificationUrl,
    });
    return NextResponse.json(
      { ok: false, error: "Webhook env not configured" },
      { status: 500 }
    );
  }

  const isValid = verifySquareSignature({
    signatureKey,
    notificationUrl: notificationUrl.trim(),
    rawBody,
    signatureHeader: signature,
  });

  if (!isValid) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch (e) {
    console.error("[Webhook] JSON parse error:", e);
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  // ✅ idempotency (best-effort)
  const eventId = getEventId(event);
  if (eventId) {
    if (seenEventIds.has(eventId)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    seenEventIds.add(eventId);
  }

  const type = getEventType(event);
  const eventCreatedAt = getEventCreatedAt(event);

  try {
    switch (type) {
      // ----------------------------
      // Subscriptions API events
      // ----------------------------
      case "subscription.created":
      case "subscription.updated": {
        const subscriptionId = getSubscriptionId(event);
        let sub = getSubscriptionFromEvent(event);

        if (!subscriptionId) {
          console.warn(`${type} missing subscriptionId`);
          break;
        }

        try {
          const fetched = await fetchSubscription(subscriptionId);
          sub = fetched?.subscription ?? sub;
        } catch (e) {
          console.warn(`${type}: could not fetch subscription`, e);
        }

        const status = String(sub?.status ?? "").trim();
        const customerId = String(sub?.customer_id ?? "").trim();
        const planId = String(sub?.plan_variation_id ?? "").trim();

        const startDate = String(sub?.start_date ?? "").trim(); // YYYY-MM-DD
        const chargedThroughDate = String(sub?.charged_through_date ?? "").trim(); // YYYY-MM-DD
        const nextBillingDate = computeNextBillingDate(sub); // YYYY-MM-DD

        await postToPhp("subscription-updated", {
          event_type: type,
          event_created_at: eventCreatedAt,
          subscription_id: subscriptionId,
          square_customer_id: customerId,
          plan_variation_id: planId,
          status: status,
          start_date: startDate,
          charged_through_date: chargedThroughDate,
          next_billing_date: nextBillingDate,
        });

        break;
      }

      // ----------------------------
      // Invoices API events (subscription billing)
      // ----------------------------
      case "invoice.created":
      case "invoice.published":
      case "invoice.updated":
      case "invoice.canceled":
      case "invoice.refunded":
      case "invoice.deleted": {
        // (kept as-is)
        const invoiceId = getInvoiceId(event);
        const inv = getInvoiceFromEvent(event);

        const subscriptionId =
          String(inv?.subscription_id ?? "").trim() ||
          String(event?.data?.object?.subscription_id ?? "").trim() ||
          "";

        void invoiceId;
        void subscriptionId;

        break;
      }

      // ✅ Renewal success
      case "invoice.payment_made": {
        const invoiceFromEvent = getInvoiceFromEvent(event);
        const invoiceId = getInvoiceId(event);

        let subscriptionId =
          String(invoiceFromEvent?.subscription_id ?? "").trim() ||
          String(event?.data?.object?.subscription_id ?? "").trim() ||
          "";

        if (!invoiceId) {
          console.warn("invoice.payment_made missing invoice id");
          break;
        }

        // Fetch invoice (reliable source for subscription_id, customer, amount, email)
        let fetchedInvoice: any = null;
        try {
          const fetched = await fetchInvoice(invoiceId);
          fetchedInvoice = fetched?.invoice ?? null;
          if (!subscriptionId) subscriptionId = String(fetchedInvoice?.subscription_id ?? "").trim();
        } catch (e) {
          console.warn("invoice.payment_made: could not fetch invoice", e);
        }

        const squareCustomerId =
          String(fetchedInvoice?.primary_recipient?.customer_id ?? "").trim() ||
          String(invoiceFromEvent?.primary_recipient?.customer_id ?? "").trim() ||
          "";

        // ✅ NEW: recipient email (best-effort, present in your sample payload)
        const email =
          String(fetchedInvoice?.primary_recipient?.email_address ?? "").trim() ||
          String(invoiceFromEvent?.primary_recipient?.email_address ?? "").trim() ||
          "";

        // amount (cents)
        const amountCents =
          fetchedInvoice?.payment_requests?.[0]?.computed_amount_money?.amount ??
          fetchedInvoice?.payment_requests?.[0]?.request_method?.amount_money?.amount ??
          fetchedInvoice?.payment_requests?.[0]?.total_completed_amount_money?.amount ??
          null;

        const currency =
          String(
            fetchedInvoice?.payment_requests?.[0]?.computed_amount_money?.currency ??
              fetchedInvoice?.payment_requests?.[0]?.request_method?.amount_money?.currency ??
              fetchedInvoice?.payment_requests?.[0]?.total_completed_amount_money?.currency ??
              "USD"
          ).trim() || "USD";

        // paid_at: use invoice updated_at or event created_at as fallback
        const paidAt =
          String(fetchedInvoice?.updated_at ?? "").trim() ||
          String(invoiceFromEvent?.updated_at ?? "").trim() ||
          eventCreatedAt ||
          "";

        // ✅ Update next_billing_date by fetching subscription after payment
        let nextBillingDate = "";
        let chargedThroughDate = "";
        let subscriptionStatus = "";
        let planVariationId = "";

        if (subscriptionId) {
          try {
            const fetchedSub = await fetchSubscription(subscriptionId);
            const s = fetchedSub?.subscription ?? null;
            chargedThroughDate = String(s?.charged_through_date ?? "").trim();
            nextBillingDate = computeNextBillingDate(s);
            subscriptionStatus = String(s?.status ?? "").trim();
            planVariationId = String(s?.plan_variation_id ?? "").trim();
          } catch (e) {
            console.warn(
              "invoice.payment_made: could not fetch subscription for next_billing_date",
              e
            );
          }
        }

        const amountToSend =
          amountCents == null ? "0" : (Number(amountCents) / 100).toFixed(2);

        await postToPhp("invoice-payment-made", {
          event_type: type,
          event_created_at: eventCreatedAt,
          invoice_id: invoiceId,
          subscription_id: subscriptionId,
          square_customer_id: squareCustomerId,

          // ✅ NEW FIELD
          email: email,

          amount: amountToSend,
          currency: currency,
          paid_at: paidAt,
          payment_id: "",

          charged_through_date: chargedThroughDate,
          next_billing_date: nextBillingDate,
          subscription_status: subscriptionStatus,
          plan_variation_id: planVariationId,
        });

        break;
      }

      case "invoice.scheduled_charge_failed": {
        // (kept as-is)
        const invoiceId = getInvoiceId(event);
        const invoiceFromEvent = getInvoiceFromEvent(event);

        let subscriptionId =
          String(invoiceFromEvent?.subscription_id ?? "").trim() ||
          String(event?.data?.object?.subscription_id ?? "").trim() ||
          "";

        if (invoiceId && !subscriptionId) {
          try {
            const fetched = await fetchInvoice(invoiceId);
            subscriptionId = String(fetched?.invoice?.subscription_id ?? "").trim();
          } catch (e) {
            console.warn("invoice.scheduled_charge_failed: could not fetch invoice", e);
          }
        }

        if (subscriptionId) {
          try {
            const fetchedSub = await fetchSubscription(subscriptionId);
            const s = fetchedSub?.subscription ?? null;
            const chargedThroughDate = String(s?.charged_through_date ?? "").trim();
            const nextBillingDate = computeNextBillingDate(s);
            void chargedThroughDate;
            void nextBillingDate;
          } catch (e) {
            console.warn("invoice.scheduled_charge_failed: could not fetch subscription", e);
          }
        }

        break;
      }

      // ----------------------------
      // Disputes
      // ----------------------------
      case "dispute.created":
      case "dispute.state.updated": {
        const dispute = event?.data?.object?.dispute ?? null;

        const disputeId = String(event?.data?.id ?? dispute?.id ?? "").trim();
        const disputeState = String(dispute?.state ?? "").trim();
        const paymentId = String(dispute?.disputed_payment?.payment_id ?? "").trim();

        const locationId =
          String(event?.location_id ?? dispute?.location_id ?? "").trim() || "";

        if (!disputeId || !paymentId) {
          console.warn("dispute event missing dispute_id or payment_id", { disputeId, paymentId });
          break;
        }

        let subscriptionId = "";
        try {
          const pay = await fetchPayment(paymentId);
          const payment = pay?.payment ?? null;

          const orderId = String(payment?.order_id ?? "").trim();
          const paymentLocationId = String(payment?.location_id ?? "").trim();
          const effectiveLocationId = paymentLocationId || locationId;

          if (orderId && effectiveLocationId) {
            const found = await searchInvoiceByOrderId({
              locationId: effectiveLocationId,
              orderId,
            });
            const inv = found?.invoices?.[0] ?? null;
            subscriptionId = String(inv?.subscription_id ?? "").trim();
          }
        } catch (e) {
          console.warn("Failed to resolve subscription_id for dispute (recording anyway):", e);
        }

        const disputeScope: "PAYMENT" | "SUBSCRIPTION" = subscriptionId ? "SUBSCRIPTION" : "PAYMENT";

        await postToPhp("upsert-dispute", {
          payment_id: paymentId,
          subscription_id: subscriptionId,
          dispute_id: disputeId,
          dispute_scope: disputeScope,
          dispute_state: disputeState || "UNKNOWN",
          event_type: type,
          event_created_at: eventCreatedAt,
        });

        break;
      }

      default:
        console.log("Unhandled event type (ignored):", type);
    }
  } catch (err) {
    console.error("Subscription webhook handler error:", err);
    // console.error("Event payload:", safeJson(event));
    void safeJson; // keep helper referenced if you comment logs out
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}