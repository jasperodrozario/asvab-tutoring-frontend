// app/api/subscribe/route.ts

import { NextRequest, NextResponse } from "next/server";
import { SquareClient, SquareEnvironment, SquareError } from "square";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

type Product = "ASVAB" | "AFOQT" | "ASTB" | "SIFT" | "OAR";
type Cadence = "1M" | "3M" | "6M" | "12M";

type Payload = {
  sourceId: string; // token from Square Web Payments SDK tokenize()
  product: Product;
  cadence: Cadence;
  userEmail: string;
  userName: string;
  password?: string; // Needed for PHP registration
  mobile?: string; // Needed for PHP registration
  amount: number | string;
  course_id?: string;
  session_id?: string;

  package_id?: string; // ✅ optional
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
  if (!process.env.NEXT_PUBLIC_PHP_API_URL) missing.push("PHP_API_URL");
  if (missing.length) {
    throw new Error(
      "The server is missing required configuration. Please contact support."
    );
  }
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
  if (!value) {
    // Keep this message friendly (no env var names shown to the user)
    throw new Error(
      "This subscription option is not available right now. Please try a different plan or contact support."
    );
  }
  return value;
}

function parseAmountToCents(amount: number | string): number {
  if (typeof amount === "number") return Math.round(amount);

  if (typeof amount === "string") {
    const cleaned = amount.trim();
    if (!cleaned) throw new Error("Please enter a valid amount.");

    // If user sends "15.00" treat as dollars; if "1500" treat as cents
    if (cleaned.includes(".")) {
      const dollars = parseFloat(cleaned.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(dollars)) throw new Error("Please enter a valid amount.");
      return Math.round(dollars * 100);
    }

    const cents = parseInt(cleaned.replace(/[^0-9]/g, ""), 10);
    if (!Number.isFinite(cents)) throw new Error("Please enter a valid amount.");
    return cents;
  }

  throw new Error("Please enter a valid amount.");
}

/**
 * Sends data to PHP backend (x-www-form-urlencoded).
 * IMPORTANT: Keep user-facing errors friendly; do not expose raw PHP output.
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
  package_id?: string;

  squareSubscriptionId: string;
  squareCustomerId: string;
  squareCardId: string;
  planVariationId: string;
  orderTemplateId: string;
}) {
  const phpUrl = process.env.NEXT_PUBLIC_PHP_API_URL!;
  const phpSecret = (process.env.INTERNAL_API_SECRET || "").trim();

  const form = new URLSearchParams();

  // Matches PHP switch case
  form.append("action", "user-registration-subscription");

  // Registration data
  form.append("email", args.userEmail);
  form.append("password", args.password || "");
  form.append("mobile", args.mobile || "");

  const nameParts = String(args.userName || "").trim().split(/\s+/);
  form.append("first_name", nameParts[0] || "");
  form.append("last_name", nameParts.slice(1).join(" ") || "");

  // Payment details expected by PHP
  form.append("amount", String(args.amountInCents));
  form.append("currency", "USD");
  form.append("payment_status", "PENDING");
  form.append("square_customer_id", args.squareCustomerId);
  form.append("payment_source_type", "CARD");

  // Square identifiers expected by PHP
  form.append("subscription_id", args.squareSubscriptionId);
  form.append("plan_variation_id", args.planVariationId);

  if (args.course_id) form.append("course_id", args.course_id);
  if (args.session_id) form.append("session_id", args.session_id);
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

  // Try to parse JSON, but do not leak raw errors to users.
  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  // If PHP returns a structured error, still keep it user-friendly.
  if (!res.ok) {
    throw new Error(
      "We couldn't finish setting up your account on our system. Please try again in a moment."
    );
  }

  if (!parsed || parsed.isSuccess !== true) {
    // Some PHP responses may use ok instead of isSuccess; accept either.
    const ok = Boolean(parsed?.isSuccess ?? parsed?.ok);
    if (!ok) {
      throw new Error(
        "Your subscription was created, but we couldn't finish saving it on our system. Please contact support so we can help right away."
      );
    }
  }

  return parsed;
}

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN!,
  environment: getSquareEnvironment(),
});

function friendlySquareError(err: unknown): string {
  if (err instanceof SquareError) {
    const first = err.errors?.[0];
    const detail = first?.detail || first?.code || "A payment service error occurred.";
    return `We couldn't complete the request with our payment provider. ${detail}`;
  }
  if (err instanceof Error) return err.message || "Something went wrong. Please try again.";
  return "Something went wrong. Please try again.";
}

export async function POST(req: NextRequest) {
  try {
    assertRequiredEnv();

    let body: Partial<Payload> = {};
    try {
      body = (await req.json()) as Partial<Payload>;
    } catch {
      return NextResponse.json(
        { success: false, message: "Please send a valid request." },
        { status: 400 }
      );
    }

    // Validation
    if (!body.sourceId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "We couldn't verify your payment method. Please refresh the page and try again.",
        },
        { status: 400 }
      );
    }

    if (!isProduct(body.product) || !isCadence(body.cadence)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please choose a valid product and subscription length, then try again.",
        },
        { status: 400 }
      );
    }

    if (!body.userEmail || !String(body.userEmail).includes("@")) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!body.userName || !String(body.userName).trim()) {
      return NextResponse.json(
        { success: false, message: "Please enter your full name." },
        { status: 400 }
      );
    }

    const amountInCents = parseAmountToCents(body.amount as any);
    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid amount." },
        { status: 400 }
      );
    }

    const planVariationId = getPlanVariationId(body.product, body.cadence);

    // 1) Square: Create Customer
    const { customer } = await squareClient.customers.create({
      idempotencyKey: randomUUID(),
      givenName: String(body.userName),
      emailAddress: String(body.userEmail),
    });
    if (!customer?.id) {
      throw new Error(
        "We couldn't create your customer profile with the payment provider. Please try again."
      );
    }

    // 2) Square: Create Card on File
    const { card } = await squareClient.cards.create({
      idempotencyKey: randomUUID(),
      sourceId: String(body.sourceId),
      card: { customerId: customer.id },
    });
    if (!card?.id) {
      throw new Error(
        "We couldn't securely save your payment method. Please try again."
      );
    }

    // 3) Square: Create Order Template for pricing
    const { order } = await squareClient.orders.create({
      idempotencyKey: randomUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID!,
        state: "DRAFT",
        lineItems: [
          {
            name: `${body.product} Subscription`,
            quantity: "1",
            basePriceMoney: {
              amount: BigInt(amountInCents),
              currency: "USD",
            },
          },
        ],
      },
    });
    if (!order?.id) {
      throw new Error(
        "We couldn't prepare your subscription details. Please try again."
      );
    }

    // 4) Square: Create Subscription
    const { subscription } = await squareClient.subscriptions.create({
      idempotencyKey: randomUUID(),
      locationId: process.env.SQUARE_LOCATION_ID!,
      customerId: customer.id,
      planVariationId,
      cardId: card.id,
      phases: [{ ordinal: BigInt(0), orderTemplateId: order.id }],
    });
    if (!subscription?.id) {
      throw new Error(
        "We couldn't create your subscription. Please try again."
      );
    }

    // 5) Save to PHP
    const phpSave = await saveSubscriptionToPhp({
      product: body.product,
      cadence: body.cadence,
      amountInCents,
      userEmail: String(body.userEmail),
      userName: String(body.userName),
      password: body.password,
      mobile: body.mobile,
      course_id: body.course_id,
      session_id: body.session_id,
      package_id: body.package_id,

      squareSubscriptionId: subscription.id,
      squareCustomerId: customer.id,
      squareCardId: card.id,
      planVariationId,
      orderTemplateId: order.id,
    });

    return NextResponse.json({
      success: true,
      message: "All set! Your subscription has been created successfully.",
      subscriptionId: subscription.id,
      php: phpSave,
    });
  } catch (error: unknown) {
    const message = friendlySquareError(error);

    // If it’s one of our known “friendly” messages, return 400; otherwise 500.
    const isClientStyle =
      typeof message === "string" &&
      (message.startsWith("Please ") ||
        message.startsWith("We couldn't verify") ||
        message.startsWith("This subscription option") ||
        message.startsWith("We couldn't"));

    return NextResponse.json(
      { success: false, message },
      { status: isClientStyle ? 400 : 500 }
    );
  }
}