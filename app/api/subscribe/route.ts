// app\api\subscribe\route.ts

import { NextRequest, NextResponse } from "next/server";
import { SquareClient, SquareEnvironment, SquareError } from "square";
import { randomUUID } from "crypto";

type Product = "ASVAB" | "AFOQT" | "ASTB" | "SIFT" | "OAR";
type Cadence = "1M" | "3M" | "6M" | "12M";

type Payload = {
  sourceId: string; // token from Square Web Payments SDK tokenize()
  product: Product;
  cadence: Cadence;
  userEmail: string;
  userName: string;
  password?: string; // Needed for PHP registration
  mobile?: string;   // Needed for PHP registration
  amount: number | string;
  course_id?: string;
  session_id?: string;

  // ✅ ADDED
  package_id?: string;
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
  if (!process.env.PHP_API_URL) missing.push("PHP_API_URL");
  if (missing.length) throw new Error(`Missing required env vars: ${missing.join(", ")}`);
}

function isProduct(x: any): x is Product {
  return ["ASVAB", "AFOQT", "ASTB", "SIFT", "OAR"].includes(x);
}

function isCadence(x: any): x is Cadence {
  return ["1M", "3M", "6M", "12M"].includes(x);
}

function getPlanVariationId(product: Product, cadence: Cadence): string {
  const key = `SQUARE_SUB_PLAN_${product}_${cadence}`;
  const value = process.env[key];
  if (!value) throw new Error(`Missing env var ${key}`);
  return value;
}

function parseAmountToCents(amount: number | string): number {
  if (typeof amount === "number") return Math.round(amount);
  if (typeof amount === "string") {
    const cleaned = amount.trim();
    if (cleaned.includes(".")) {
      const dollars = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
      return Math.round(dollars * 100);
    }
    return parseInt(cleaned.replace(/[^0-9]/g, ""), 10);
  }
  throw new Error("Invalid amount.");
}

/**
 * Sends data to PHP backend.
 * Updated to use keys expected by the PHP $_POST and database logic.
 */
async function saveSubscriptionToPhp(args: {
  product: Product;
  cadence: Cadence;
  amountInCents: number;
  userEmail: string;
  userName: string;
  password?: string;
  mobile?: string;
  course_id?: string;
  session_id?: string;

  // ✅ ADDED
  package_id?: string;

  squareSubscriptionId: string;
  squareCustomerId: string;
  squareCardId: string;
  planVariationId: string;
  orderTemplateId: string;
}) {
  const phpUrl = process.env.PHP_API_URL!;
  const phpSecret = process.env.PHP_API_SECRET || "";

  const form = new URLSearchParams();

  // 1. Matches PHP switch case
  form.append("action", "user-registration-subscription");

  // 2. User Registration Data (matches edu_user expectations)
  form.append("email", args.userEmail);
  form.append("password", args.password || "");
  form.append("mobile", args.mobile || "");

  const nameParts = args.userName.trim().split(/\s+/);
  form.append("first_name", nameParts[0] || "");
  form.append("last_name", nameParts.slice(1).join(" ") || "");

  // 3. Payment details (matches asvab_recurrent_payments and subscription)
  form.append("amount", String(args.amountInCents));
  form.append("currency", "USD");
  form.append("payment_status", "PENDING");
  form.append("square_customer_id", args.squareCustomerId);
  form.append("payment_source_type", "CARD");

  // 4. Square identifiers mapped to PHP expectations
  form.append("subscription_id", args.squareSubscriptionId);
  form.append("plan_variation_id", args.planVariationId);

  if (args.course_id) form.append("course_id", args.course_id);
  if (args.session_id) form.append("session_id", args.session_id);

  // ✅ ADDED: send package_id to PHP
  if (args.package_id) form.append("package_id", args.package_id);

  const res = await fetch(phpUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      ...(phpSecret ? { "X-ASVAB-SECRET": phpSecret } : {}),
    },
    body: form.toString(),
  });

  const raw = await res.text();
  try {
    const json = JSON.parse(raw);
    if (!res.ok || !json?.isSuccess) throw new Error(json?.message || "PHP Save Failed");
    return json;
  } catch {
    throw new Error(`PHP Error: ${raw.slice(0, 100)}`);
  }
}

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: getSquareEnvironment(),
});

export async function POST(req: NextRequest) {
  try {
    assertRequiredEnv();
    const body = (await req.json()) as Partial<Payload>;

    // 1. Validation
    if (!body.sourceId || !isProduct(body.product) || !isCadence(body.cadence)) {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const amountInCents = parseAmountToCents(body.amount as any);
    const planVariationId = getPlanVariationId(body.product, body.cadence);

    // 2. Square: Create Customer
    const { customer } = await squareClient.customers.create({
      idempotencyKey: randomUUID(),
      givenName: body.userName,
      emailAddress: body.userEmail,
    });
    if (!customer?.id) throw new Error("Customer creation failed.");

    // 3. Square: Create Card on File
    const { card } = await squareClient.cards.create({
      idempotencyKey: randomUUID(),
      sourceId: body.sourceId,
      card: { customerId: customer.id },
    });
    if (!card?.id) throw new Error("Card link failed.");

    // 4. Square: Create Order Template for relative pricing
    const { order } = await squareClient.orders.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID!,
        state: "DRAFT",
        lineItems: [
          {
            name: `${body.product} Subscription`,
            quantity: "1",
            basePriceMoney: { amount: BigInt(amountInCents), currency: "USD" },
          },
        ],
      },
    });
    if (!order?.id) throw new Error("Order template failed.");

    // 5. Square: Create Subscription
    const { subscription } = await squareClient.subscriptions.create({
      idempotencyKey: randomUUID(),
      locationId: process.env.SQUARE_LOCATION_ID!,
      customerId: customer.id,
      planVariationId,
      cardId: card.id,
      phases: [{ ordinal: BigInt(0), orderTemplateId: order.id }],
    });
    if (!subscription?.id) throw new Error("Subscription failed.");

    // 6. Save to PHP
    const phpSave = await saveSubscriptionToPhp({
      product: body.product,
      cadence: body.cadence,
      amountInCents,
      userEmail: body.userEmail!,
      userName: body.userName!,
      password: body.password,
      mobile: body.mobile,
      course_id: body.course_id,
      session_id: body.session_id,

      // ✅ ADDED
      package_id: body.package_id,

      squareSubscriptionId: subscription.id,
      squareCustomerId: customer.id,
      squareCardId: card.id,
      planVariationId,
      orderTemplateId: order.id,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      php: phpSave,
    });
  } catch (error: any) {
    const msg = error instanceof SquareError ? error.errors[0].detail : error.message;
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}