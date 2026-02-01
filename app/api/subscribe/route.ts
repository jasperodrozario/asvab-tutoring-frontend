import { NextRequest, NextResponse } from "next/server";
import { SquareClient, SquareEnvironment, SquareError } from "square";
import { randomUUID } from "crypto";

type Product = "ASVAB" | "AFOQT" | "ASTB" | "SIFT" | "OAR";
type Cadence = "1M" | "3M" | "6M" | "12M";

type Payload = {
  sourceId: string; // token/nonce from Square Web Payments SDK tokenize()
  product: Product;
  cadence: Cadence;
  userEmail: string;
  userName: string;

  // REQUIRED for RELATIVE pricing: send amount in cents (e.g., 1500)
  amount: number | string;

  // optional extras (ignored by Square, but useful for your logs later)
  course_id?: string;
  session_id?: string;
};

function getSquareEnvironment(): SquareEnvironment {
  const env = (process.env.SQUARE_ENVIRONMENT || "sandbox").toLowerCase();
  return env === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;
}

function assertRequiredEnv(): void {
  const missing: string[] = [];
  if (!process.env.SQUARE_ACCESS_TOKEN) missing.push("SQUARE_ACCESS_TOKEN");
  if (!process.env.SQUARE_LOCATION_ID) missing.push("SQUARE_LOCATION_ID");
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

function isProduct(x: any): x is Product {
  return x === "ASVAB" || x === "AFOQT" || x === "ASTB" || x === "SIFT" || x === "OAR";
}

function isCadence(x: any): x is Cadence {
  return x === "1M" || x === "3M" || x === "6M" || x === "12M";
}

/**
 * Server-side plan selection:
 * maps product+cadence -> env var -> Square plan variation ID
 */
function getPlanVariationId(product: Product, cadence: Cadence): string {
  const key = `SQUARE_SUB_PLAN_${product}_${cadence}`;
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing env var ${key}. Add it to .env.local with the correct Square plan variation ID.`);
  }
  return value;
}

/**
 * Parse amount (expects cents).
 * Accepts:
 *  - 1500  (number) -> cents
 *  - "1500" (string cents)
 *  - "15.00" or "$15.00" (string dollars) -> converts to cents
 */
function parseAmountToCents(amount: number | string): number {
  if (typeof amount === "number") {
    if (!Number.isFinite(amount)) throw new Error("amount must be a finite number.");
    const cents = Math.round(amount);
    if (cents <= 0) throw new Error("amount must be > 0.");
    return cents;
  }

  if (typeof amount === "string") {
    const cleaned = amount.trim();

    // If it contains a decimal point, treat as dollars
    if (cleaned.includes(".")) {
      const dollars = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(dollars)) throw new Error("amount is invalid.");
      const cents = Math.round(dollars * 100);
      if (cents <= 0) throw new Error("amount must be > 0.");
      return cents;
    }

    // Otherwise treat as cents string
    const cents = parseInt(cleaned.replace(/[^0-9]/g, ""), 10);
    if (!Number.isFinite(cents) || cents <= 0) throw new Error("amount must be > 0.");
    return cents;
  }

  throw new Error("amount is required.");
}

// Initialize Square client (v44+ uses `token`)
const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: getSquareEnvironment(),
});

export async function POST(req: NextRequest) {
  try {
    assertRequiredEnv();

    const body = (await req.json()) as Partial<Payload>;

    const sourceId = body.sourceId;
    const product = body.product;
    const cadence = body.cadence;
    const userEmail = body.userEmail;
    const userName = body.userName;
    const amount = body.amount;

    // Validate input
    if (!sourceId || typeof sourceId !== "string") {
      return NextResponse.json({ success: false, error: "sourceId is required." }, { status: 400 });
    }

    if (!isProduct(product)) {
      return NextResponse.json(
        { success: false, error: "Invalid product. Use ASVAB, AFOQT, ASTB, SIFT, or OAR." },
        { status: 400 }
      );
    }

    if (!isCadence(cadence)) {
      return NextResponse.json(
        { success: false, error: "Invalid cadence. Use 1M, 3M, 6M, or 12M." },
        { status: 400 }
      );
    }

    if (!userEmail || typeof userEmail !== "string") {
      return NextResponse.json({ success: false, error: "userEmail is required." }, { status: 400 });
    }

    if (!userName || typeof userName !== "string") {
      return NextResponse.json({ success: false, error: "userName is required." }, { status: 400 });
    }

    // For RELATIVE pricing, we MUST build an order template (draft order)
    const amountInCents = parseAmountToCents(amount as any);

    // Server picks correct plan variation id from env
    const planVariationId = getPlanVariationId(product, cadence);

    // 1) Create Customer
    const { customer } = await squareClient.customers.create({
      idempotencyKey: randomUUID(),
      givenName: userName,
      emailAddress: userEmail,
    });

    if (!customer?.id) throw new Error("Failed to create customer.");

    // 2) Create Card on File
    const { card } = await squareClient.cards.create({
      idempotencyKey: randomUUID(),
      sourceId,
      card: { customerId: customer.id },
    });

    if (!card?.id) throw new Error("Failed to link card.");

    // 3) Create ORDER TEMPLATE (DRAFT order) for RELATIVE pricing
    //    IMPORTANT: amount must be bigint in many Square SDK versions
    const { order } = await squareClient.orders.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID!,
        state: "DRAFT",
        lineItems: [
          {
            name: `${product} Subscription (${cadence})`,
            quantity: "1",
            basePriceMoney: {
              amount: BigInt(amountInCents),
              currency: "USD",
            },
          },
        ],
      },
    });

    const orderTemplateId = order?.id;
    if (!orderTemplateId) throw new Error("Failed to create order template (missing order id).");

    // 4) Create Subscription
    // IMPORTANT:
    // - Do NOT send cadence/pricing here (those are in the plan variation catalog)
    // - For RELATIVE pricing phases, you MUST send phases with ordinal + orderTemplateId
    const { subscription } = await squareClient.subscriptions.create({
      idempotencyKey: randomUUID(),
      locationId: process.env.SQUARE_LOCATION_ID!,
      customerId: customer.id,
      planVariationId,
      cardId: card.id,
      phases: [
        {
          ordinal: BigInt(0),
          orderTemplateId: orderTemplateId,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription?.id,
      customerId: customer.id,
      product,
      cadence,
      amountInCents,
      orderTemplateId,
    });
  } catch (error: unknown) {
    if (error instanceof SquareError) {
      console.error("Square API Error:", error.errors);
      return NextResponse.json(
        { success: false, error: error.errors?.[0]?.detail ?? "Square API error" },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Internal Server Error";
    console.error("Unexpected error:", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
