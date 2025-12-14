import { NextRequest, NextResponse } from "next/server";

const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN!;
const LOCATION_ID = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID!;
const ENV = process.env.SQUARE_ENVIRONMENT || "sandbox";

export async function POST(req: NextRequest) {
  try {
    const { sourceId, amount } = await req.json();

    const url =
      ENV === "sandbox"
        ? "https://connect.squareupsandbox.com/v2/payments"
        : "https://connect.squareup.com/v2/payments";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        "Square-Version": "2024-01-18",
      },
      body: JSON.stringify({
        source_id: sourceId,
        idempotency_key: crypto.randomUUID(),
        amount_money: {
          amount,
          currency: "USD",
        },
        location_id: LOCATION_ID,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );
  } catch (error) {
  console.error("Payment failed:", error);
  return NextResponse.json({ success: false, error });
}
}
