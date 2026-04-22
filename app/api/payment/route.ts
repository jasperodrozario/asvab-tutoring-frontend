// app/api/payment/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function safeStr(v: unknown, max = 200) {
  const s = String(v ?? "").trim();
  return s.length > max ? s.slice(0, max) : s;
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

function getEnv() {
  return {
    accessToken: safeStr(process.env.SQUARE_ACCESS_TOKEN || "", 500),
    locationId: safeStr(
      process.env.SQUARE_LOCATION_ID ||
        process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID ||
        "",
      100,
    ),
    environment: safeStr(
      process.env.SQUARE_ENVIRONMENT || "sandbox",
      30,
    ).toLowerCase(),
    squareVersion: safeStr(process.env.SQUARE_VERSION || "2026-01-22", 50),
    phpApiUrl: safeStr(process.env.NEXT_PUBLIC_PHP_API_URL || "", 500),
    internalApiSecret: safeStr(process.env.INTERNAL_API_SECRET || "", 200),
  };
}

function getSquareBaseUrl(environment: string) {
  return environment === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
}

function getSourceId(raw: any): string {
  if (typeof raw === "string") return raw.trim();

  if (raw && typeof raw === "object") {
    if (typeof raw.token === "string") return raw.token.trim();
    if (typeof raw.id === "string") return raw.id.trim();
    if (typeof raw.sourceId === "string") return raw.sourceId.trim();
  }

  return "";
}

function getUserSafeSquareMessage(squareData: any): string {
  const detail =
    squareData?.errors?.[0]?.detail || squareData?.errors?.[0]?.message || "";

  const d = String(detail).toLowerCase();

  if (
    d.includes("card") ||
    d.includes("nonce") ||
    d.includes("token") ||
    d.includes("source_id") ||
    d.includes("postal") ||
    d.includes("cvv") ||
    d.includes("expired") ||
    d.includes("declined")
  ) {
    return "Payment failed. Please try again or use a different card.";
  }

  if (d.includes("location")) {
    return "Payment setup is incomplete. Please contact support.";
  }

  if (d.includes("authorization") || d.includes("access token")) {
    return "Payment service authentication failed. Please contact support.";
  }

  return "Payment failed. Please try again or use a different card. If the issue continues, contact support.";
}

export async function POST(req: NextRequest) {
  try {
    const {
      accessToken,
      locationId,
      environment,
      squareVersion,
      phpApiUrl,
      internalApiSecret,
    } = getEnv();

    if (!accessToken || !locationId) {
      console.error("[/api/payment] Missing Square configuration");

      return json(500, {
        success: false,
        error:
          "Payment service is not configured properly. Please contact support.",
        message:
          "Payment service is not configured properly. Please contact support.",
      });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      console.error("[/api/payment] Invalid request body");

      return json(400, {
        success: false,
        error: "We couldn't read your payment details. Please try again.",
        message: "We couldn't read your payment details. Please try again.",
      });
    }

    const sourceId = getSourceId(body?.sourceId);
    const amount = body?.amount;
    const course_id = body?.course_id;
    const session_id = body?.session_id;
    const package_id = body?.package_id;
    const user = body?.user || {};

    if (!sourceId) {
      return json(400, {
        success: false,
        error: "Payment method is missing. Please refresh and try again.",
        message: "Payment method is missing. Please refresh and try again.",
      });
    }

    const amountCents = Number(amount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return json(400, {
        success: false,
        error:
          "The payment amount looks incorrect. Please reload the page and try again.",
        message:
          "The payment amount looks incorrect. Please reload the page and try again.",
      });
    }

    const amountCentsInt = Math.round(amountCents);

    // 1) Create Customer permanently in Square
    let customerId: string | undefined = undefined;
    try {
      const customerUrl = `${getSquareBaseUrl(environment)}/v2/customers`;
      const customerPayload = {
        idempotency_key: crypto.randomUUID(),
        given_name: safeStr(user?.first_name, 100),
        family_name: safeStr(user?.last_name, 100),
        email_address: safeStr(user?.email, 120),
        reference_id: safeStr(user?.id || "", 100), // Optional link to system's ID
      };

      const customerRes = await fetch(customerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "Square-Version": squareVersion,
        },
        body: JSON.stringify(customerPayload),
      });

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        customerId = customerData?.customer?.id;
      }
    } catch (err) {
      console.error("[/api/payment] Failed to create Square customer", err);
      // We continue with the payment even if customer creation fails
    }

    // 2) Process Payment and link to Customer
    const squareUrl = `${getSquareBaseUrl(environment)}/v2/payments`;

    const squarePayload: any = {
      source_id: sourceId,
      idempotency_key: crypto.randomUUID(),
      amount_money: {
        amount: amountCentsInt,
        currency: "USD",
      },
      location_id: locationId,
    };

    if (customerId) {
      squarePayload.customer_id = customerId;
    }

    if (user?.email) {
      squarePayload.buyer_email_address = safeStr(user.email, 120);
    }

    const squareRes = await fetch(squareUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "Square-Version": squareVersion,
      },
      body: JSON.stringify(squarePayload),
      cache: "no-store",
    });

    const squareText = await squareRes.text();

    let squareData: any = null;
    try {
      squareData = squareText ? JSON.parse(squareText) : null;
    } catch {
      console.error("[/api/payment] Unable to parse Square response");
      squareData = {
        raw: squareText?.slice?.(0, 2000) || "",
      };
    }

    if (!squareRes.ok) {
      console.error("[/api/payment] Square payment failed", {
        status: squareRes.status,
      });

      return json(400, {
        success: false,
        error: getUserSafeSquareMessage(squareData),
        message: getUserSafeSquareMessage(squareData),
        square_errors: squareData?.errors || null,
      });
    }

    const payment = squareData?.payment;
    const squareStatus = safeStr(payment?.status || "", 50);

    if (!payment || !["APPROVED", "COMPLETED"].includes(squareStatus)) {
      console.error("[/api/payment] Payment not approved", {
        status: squareStatus,
      });

      return json(400, {
        success: false,
        error:
          "Your payment was not approved. Please try again or use a different card.",
        message:
          "Your payment was not approved. Please try again or use a different card.",
      });
    }

    let registrationSuccess = false;

    if (!phpApiUrl) {
      console.error("[/api/payment] Missing PHP_API_URL");
    } else {
      const amountDollars = (amountCentsInt / 100).toString();

      const phpParams = new URLSearchParams({
        action: "user-registration-one-time-square-payment",
        internal_api_secret: internalApiSecret,
        payment_status: "COMPLETED",
        order_id: safeStr(payment?.order_id || payment?.id || "", 120),
        payment_id: safeStr(payment?.id || "", 120),
        amount: amountDollars,
        currency: "USD",
        created_at: new Date().toISOString(),
        course_id: safeStr(course_id ?? "", 50),
        session_id: safeStr(session_id ?? "", 50),
        package_id: safeStr(package_id ?? "", 50),
        payment_source_type: "CARD",

        first_name: safeStr(user?.first_name ?? "", 80),
        last_name: safeStr(user?.last_name ?? "", 80),
        email: safeStr(user?.email ?? "", 120),
        mobile: safeStr(user?.mobile ?? "", 40),
        password: safeStr(user?.password ?? "", 200),
      });

      try {
        const phpRes = await fetch(phpApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Accept: "application/json,text/plain,*/*",
          },
          body: phpParams.toString(),
          cache: "no-store",
        });

        const phpText = await phpRes.text();

        let registrationResponse: any = null;
        try {
          registrationResponse = phpText ? JSON.parse(phpText) : null;
        } catch {
          console.error("[/api/payment] Unable to parse PHP response");
          registrationResponse = {
            raw: phpText?.slice?.(0, 2000) || "",
          };
        }

        registrationSuccess =
          phpRes.ok &&
          (registrationResponse?.isSuccess === true ||
            registrationResponse?.ok === true ||
            registrationResponse?.success === true ||
            registrationResponse?.status === 200);
      } catch {
        console.error("[/api/payment] PHP registration request failed");
        registrationSuccess = false;
      }
    }

    if (!registrationSuccess) {
      return json(200, {
        success: true,
        error: "",
        message:
          "Payment received successfully. We’re finalizing your enrollment now. If access doesn’t appear soon, please contact support with your payment ID.",
        squareStatus,
        payment_id: payment?.id || "",
        paymentId: payment?.id || "",
        registrationSuccess: false,
      });
    }

    return json(200, {
      success: true,
      error: "",
      message: "Payment successful! Your enrollment is complete.",
      squareStatus,
      payment_id: payment?.id || "",
      paymentId: payment?.id || "",
      registrationSuccess: true,
    });
  } catch {
    console.error("[/api/payment] Fatal error");

    return json(500, {
      success: false,
      error:
        "We couldn't process your payment right now. Please try again in a moment.",
      message:
        "We couldn't process your payment right now. Please try again in a moment.",
    });
  }
}
