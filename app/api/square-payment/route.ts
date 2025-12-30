import { NextRequest, NextResponse } from "next/server";

// If you hit edge/runtime issues, uncomment this:
// export const runtime = "nodejs";

const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const LOCATION_ID =
  process.env.SQUARE_LOCATION_ID || process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!;
const ENV = process.env.SQUARE_ENVIRONMENT || "sandbox";
const SQUARE_VERSION = "2024-01-18";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { sourceId, amount, course_id, session_id, user } = body;

    // ---- Basic validation
    if (!sourceId) {
      return NextResponse.json(
        { success: false, where: "validation", error: "Missing sourceId" },
        { status: 400 }
      );
    }

    const amountCents = Number(amount);
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      return NextResponse.json(
        {
          success: false,
          where: "validation",
          error: "Invalid amount (must be cents integer like 8500)",
        },
        { status: 400 }
      );
    }

    // (recommended) ensure integer cents
    const amountCentsInt = Math.round(amountCents);

    // ---- 1) Create Square payment via REST
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
          amount: amountCentsInt, // cents integer (REST API)
          currency: "USD",
        },
        location_id: LOCATION_ID,
      }),
    });

    const squareText = await squareRes.text();
    let squareData: any;
    try {
      squareData = JSON.parse(squareText);
    } catch {
      squareData = { raw: squareText };
    }

    if (!squareRes.ok) {
      return NextResponse.json(
        { success: false, where: "square", error: squareData },
        { status: 400 }
      );
    }

    const payment = squareData?.payment;
    const squareStatus = payment?.status;

    // Sandbox can be APPROVED, production often COMPLETED
    if (!payment || !["APPROVED", "COMPLETED"].includes(squareStatus ?? "")) {
      return NextResponse.json(
        {
          success: false,
          where: "square_status",
          squareStatus,
          squareData,
        },
        { status: 400 }
      );
    }

    // ---- 2) Call PHP enrollment API
    // PHP expects dollars (e.g. "85"), not cents
    const amountDollars = (amountCentsInt / 100).toString();

    const phpParams = new URLSearchParams({
      action: "user-registration",
      payment_status: "COMPLETED", // only AFTER Square success
      order_id: payment?.order_id || payment?.id || "",
      payment_id: payment?.id || "",
      amount: amountDollars,
      currency: "USD",
      created_at: new Date().toISOString(),
      course_id: String(course_id ?? ""),
      session_id: String(session_id ?? ""),
      payment_source_type: "CARD",

      // explicit user fields (safer than ...user)
      first_name: String(user?.first_name ?? ""),
      last_name: String(user?.last_name ?? ""),
      email: String(user?.email ?? ""),
      mobile: String(user?.mobile ?? ""),
      password: String(user?.password ?? ""),
    });

    let registrationSuccess = false;
    let registrationResponse: any = null;

    try {
      const phpRes = await fetch(
        "https://test-prep.asvab-tutoring.com/practice-test/asvab-api.php",
        {
          method: "POST",
          headers: {
            // ✅ 415 fix: make it explicit + include charset
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            Accept: "application/json,text/plain,*/*",
          },
          // ✅ VERY IMPORTANT: send as string
          body: phpParams.toString(),
        }
      );

      const phpText = await phpRes.text();
      try {
        registrationResponse = JSON.parse(phpText);
      } catch {
        registrationResponse = { raw: phpText };
      }

      registrationSuccess =
        phpRes.ok &&
        (registrationResponse?.isSuccess === true ||
          registrationResponse?.status === 200);
    } catch (e: any) {
      registrationResponse = { error: e?.message || "PHP API call failed" };
      registrationSuccess = false;
    }

    // ✅ Payment success regardless; enrollment save can fail separately
    return NextResponse.json(
      {
        success: true,
        squareStatus,
        payment_id: payment?.id,
        registrationSuccess,
        registrationResponse,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("square-payment route error:", error);
    return NextResponse.json(
      {
        success: false,
        where: "server",
        error: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
