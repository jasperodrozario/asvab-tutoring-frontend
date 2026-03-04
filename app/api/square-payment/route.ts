// app/api/square-payment/route.ts
import { NextRequest, NextResponse } from "next/server";

// Keep default unless you previously had runtime issues.
// If your working version did NOT set nodejs, you can comment this out.
// export const runtime = "nodejs";

const ACCESS_TOKEN = (process.env.SQUARE_ACCESS_TOKEN || "").trim();
const LOCATION_ID = (
  process.env.SQUARE_LOCATION_ID ||
  process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ||
  ""
).trim();

const ENV = (process.env.SQUARE_ENVIRONMENT || "sandbox").trim(); // keep as-is (matches your working logic)
const SQUARE_VERSION = safeStr(process.env.SQUARE_VERSION || "2026-01-22", 50);

function json(status: number, body: any) {
  return NextResponse.json(body, { status });
}

function safeStr(v: any, max = 200) {
  const s = String(v ?? "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

export async function POST(req: NextRequest) {
  try {
    // ---- Env safety checks (won't affect payment logic; prevents server misconfig)
    if (!ACCESS_TOKEN || !LOCATION_ID) {
      return json(500, {
        success: false,
        message:
          "Payment service is not configured properly. Please contact support.",
      });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json(400, {
        success: false,
        message: "We couldn't read your payment details. Please try again.",
      });
    }

    const { sourceId, amount, course_id, session_id, user } = body || {};

    // ---- Basic validation (friendly)
    if (!sourceId) {
      return json(400, {
        success: false,
        message: "Payment method is missing. Please refresh and try again.",
      });
    }

    const amountCents = Number(amount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return json(400, {
        success: false,
        message:
          "The payment amount looks incorrect. Please reload the page and try again.",
      });
    }

    const amountCentsInt = Math.round(amountCents);

    // ---- 1) Create Square payment via REST (KEEP SAME STRUCTURE)
    const squareUrl =
      ENV === "sandbox"
        ? "https://connect.squareupsandbox.com/v2/payments"
        : "https://connect.squareup.com/v2/payments";

    const squareRes = await fetch(squareUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Square-Version": SQUARE_VERSION,
      },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: crypto.randomUUID(),
        amount_money: {
          amount: amountCentsInt,
          currency: "USD",
        },
        location_id: LOCATION_ID,
      }),
    });

    const squareText = await squareRes.text();
    let squareData: any = null;
    try {
      squareData = squareText ? JSON.parse(squareText) : null;
    } catch {
      squareData = null;
    }

    if (!squareRes.ok) {
      // Do NOT leak Square raw errors to users in production
      return json(400, {
        success: false,
        message:
          "Payment failed. Please try again or use a different card. If the issue continues, contact support.",
      });
    }

    const payment = squareData?.payment;
    const squareStatus = payment?.status;

    if (!payment || !["APPROVED", "COMPLETED"].includes(squareStatus ?? "")) {
      return json(400, {
        success: false,
        message:
          "Your payment was not approved. Please try again or use a different card.",
      });
    }

    // ---- 2) Call PHP enrollment API (best effort)
    const amountDollars = (amountCentsInt / 100).toString();

    const phpParams = new URLSearchParams({
      action: "user-registration-one-time-square-payment",
      payment_status: "COMPLETED",
      order_id: safeStr(payment?.order_id || payment?.id || "", 120),
      payment_id: safeStr(payment?.id || "", 120),
      amount: amountDollars,
      currency: "USD",
      created_at: new Date().toISOString(),
      course_id: String(course_id ?? ""),
      session_id: String(session_id ?? ""),
      payment_source_type: "CARD",

      first_name: safeStr(user?.first_name ?? "", 80),
      last_name: safeStr(user?.last_name ?? "", 80),
      email: safeStr(user?.email ?? "", 120),
      mobile: safeStr(user?.mobile ?? "", 40),
      password: safeStr(user?.password ?? "", 200),
    });

    let registrationSuccess = false;

    try {
      const phpRes = await fetch(
        "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Accept: "application/json,text/plain,*/*",
          },
          body: phpParams.toString(),
        }
      );

      const phpText = await phpRes.text();

      // Avoid exposing PHP raw/HTML errors to the client
      let registrationResponse: any = null;
      try {
        registrationResponse = phpText ? JSON.parse(phpText) : null;
      } catch {
        registrationResponse = null;
      }

      registrationSuccess =
        phpRes.ok &&
        (registrationResponse?.isSuccess === true ||
          registrationResponse?.ok === true ||
          registrationResponse?.status === 200);
    } catch {
      registrationSuccess = false;
    }

    // ✅ Payment succeeded even if PHP enrollment saving fails
    if (!registrationSuccess) {
      return json(200, {
        success: true,
        message:
          "Payment received successfully. We’re finalizing your enrollment now. If access doesn’t appear soon, please contact support with your payment ID.",
        squareStatus,
        payment_id: payment?.id,
        registrationSuccess: false,
      });
    }

    return json(200, {
      success: true,
      message: "Payment successful! Your enrollment is complete.",
      squareStatus,
      payment_id: payment?.id,
      registrationSuccess: true,
    });
  } catch {
    return json(500, {
      success: false,
      message:
        "We couldn't process your payment right now. Please try again in a moment.",
    });
  }
}