import { NextRequest, NextResponse } from "next/server";
import { SquareClient, SquareEnvironment, SquareError } from "square";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

type Product = "ASVAB" | "AFOQT" | "ASTB" | "SIFT" | "OAR";
type Cadence = "1M" | "3M" | "6M" | "12M";

type Payload = {
  sourceId: string;
  product: Product;
  cadence: Cadence;
  userEmail: string;
  userName: string;
  password?: string;
  mobile?: string;
  amount: number | string;
  course_id?: string;
  session_id?: string;
  package_id?: string;
  postal_code?: string;
  country_code?: string;
};

function getSquareEnvironment(): SquareEnvironment {
  const env = String(process.env.SQUARE_ENVIRONMENT || "sandbox").trim().toLowerCase();
  return env === "production"
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox;
}

function assertRequiredEnv(): void {
  const missing: string[] = [];

  if (!process.env.SQUARE_ACCESS_TOKEN) missing.push("SQUARE_ACCESS_TOKEN");
  if (!process.env.SQUARE_LOCATION_ID) missing.push("SQUARE_LOCATION_ID");
  if (!process.env.PHP_API_URL) missing.push("PHP_API_URL");

  if (missing.length) {
    throw new Error("The server is missing required configuration. Please contact support.");
  }
}

function isProduct(x: unknown): x is Product {
  return x === "ASVAB" || x === "AFOQT" || x === "ASTB" || x === "SIFT" || x === "OAR";
}

function isCadence(x: unknown): x is Cadence {
  return x === "1M" || x === "3M" || x === "6M" || x === "12M";
}

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanPhone(value: unknown): string {
  return cleanString(value).replace(/[^\d+]/g, "");
}

function isLikelyEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getPlanVariationId(product: Product, cadence: Cadence): string {
  const key = `SQUARE_SUB_PLAN_${product}_${cadence}`;
  const value = process.env[key];

  if (!value) {
    throw new Error(
      "This subscription option is not available right now. Please try a different plan or contact support."
    );
  }

  return value.trim();
}

function parseAmountToCents(amount: number | string): number {
  if (typeof amount === "number") {
    if (!Number.isFinite(amount)) throw new Error("Please enter a valid amount.");
    return Math.round(amount);
  }

  if (typeof amount === "string") {
    const cleaned = amount.trim();
    if (!cleaned) throw new Error("Please enter a valid amount.");

    if (cleaned.includes(".")) {
      const dollars = Number.parseFloat(cleaned.replace(/[^0-9.]/g, ""));
      if (!Number.isFinite(dollars)) throw new Error("Please enter a valid amount.");
      return Math.round(dollars * 100);
    }

    const cents = Number.parseInt(cleaned.replace(/[^0-9]/g, ""), 10);
    if (!Number.isFinite(cents)) throw new Error("Please enter a valid amount.");
    return cents;
  }

  throw new Error("Please enter a valid amount.");
}

function splitName(fullName: string): { givenName: string; familyName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    givenName: parts[0] || "",
    familyName: parts.slice(1).join(" "),
  };
}

function normalizeCountryCode(value: unknown): string {
  const code = cleanString(value).toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "US";
}

function normalizePostalCode(value: unknown): string {
  return cleanString(value);
}

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
  const phpUrl = process.env.PHP_API_URL!;
  const phpSecret = cleanString(process.env.INTERNAL_API_SECRET || "");
  const form = new URLSearchParams();
  const names = splitName(args.userName);

  form.append("action", "user-registration-subscription");
  form.append("email", args.userEmail);
  form.append("password", args.password || "");
  form.append("mobile", args.mobile || "");
  form.append("first_name", names.givenName);
  form.append("last_name", names.familyName);

  form.append("amount", String(args.amountInCents));
  form.append("currency", "USD");
  form.append("payment_status", "PENDING");
  form.append("square_customer_id", args.squareCustomerId);
  form.append("payment_source_type", "CARD");

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

  let parsed: any = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    throw new Error(
      "We couldn't finish setting up your account on our system. Please try again in a moment."
    );
  }

  const ok = Boolean(parsed?.isSuccess ?? parsed?.ok);
  if (!ok) {
    throw new Error(
      "Your subscription was created, but we couldn't finish saving it on our system. Please contact support so we can help right away."
    );
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

  if (err instanceof Error) {
    return err.message || "Something went wrong. Please try again.";
  }

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

    const sourceId = cleanString(body.sourceId);
    const userEmail = cleanString(body.userEmail);
    const userName = cleanString(body.userName);
    const mobile = cleanPhone(body.mobile);
    const password = cleanString(body.password);
    const course_id = cleanString(body.course_id);
    const session_id = cleanString(body.session_id);
    const package_id = cleanString(body.package_id);
    const postalCode = normalizePostalCode(body.postal_code);
    const countryCode = normalizeCountryCode(body.country_code);

    if (!sourceId) {
      return NextResponse.json(
        {
          success: false,
          message: "We couldn't verify your payment method. Please refresh the page and try again.",
        },
        { status: 400 }
      );
    }

    if (!isProduct(body.product) || !isCadence(body.cadence)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please choose a valid product and subscription length, then try again.",
        },
        { status: 400 }
      );
    }

    if (!userEmail || !isLikelyEmail(userEmail)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!userName) {
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
    const names = splitName(userName);

    const { customer } = await squareClient.customers.create({
      idempotencyKey: randomUUID(),
      givenName: names.givenName || userName,
      familyName: names.familyName || undefined,
      emailAddress: userEmail,
      phoneNumber: mobile || undefined,
    });

    if (!customer?.id) {
      throw new Error(
        "We couldn't create your customer profile with the payment provider. Please try again."
      );
    }

    const createCardPayload: any = {
      idempotencyKey: randomUUID(),
      sourceId,
      card: {
        customerId: customer.id,
        cardholderName: userName,
      },
    };

    if (postalCode || countryCode) {
      createCardPayload.card.billingAddress = {
        country: countryCode,
        ...(postalCode ? { postalCode } : {}),
      };
    }

    const { card } = await squareClient.cards.create(createCardPayload);

    if (!card?.id) {
      throw new Error(
        "We couldn't securely save your payment method. Please try again."
      );
    }

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

    const { subscription } = await squareClient.subscriptions.create({
      idempotencyKey: randomUUID(),
      locationId: process.env.SQUARE_LOCATION_ID!,
      customerId: customer.id,
      planVariationId,
      cardId: card.id,
      phases: [
        {
          ordinal: BigInt(0),
          orderTemplateId: order.id,
        },
      ],
    });

    if (!subscription?.id) {
      throw new Error("We couldn't create your subscription. Please try again.");
    }

    const phpSave = await saveSubscriptionToPhp({
      product: body.product,
      cadence: body.cadence,
      amountInCents,
      userEmail,
      userName,
      password,
      mobile,
      course_id: course_id || undefined,
      session_id: session_id || undefined,
      package_id: package_id || undefined,
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
      cardId: card.id,
      customerId: customer.id,
      php: phpSave,
    });
  } catch (error: unknown) {
    console.error("SUBSCRIBE API ERROR:", error);

    if (error instanceof SquareError) {
      console.error("SQUARE ERROR DETAILS:", JSON.stringify(error.errors, null, 2));
    }

    const message = friendlySquareError(error);

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