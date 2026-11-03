import { createPublicKey, verify, type JsonWebKey } from "node:crypto";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys";
const KEYS_TTL_MS = 60 * 60 * 1000;

type AppleKey = JsonWebKey & { kid: string };
let cachedKeys: { keys: AppleKey[]; fetchedAt: number } | null = null;

async function appleKeys(refresh: boolean): Promise<AppleKey[]> {
  if (!refresh && cachedKeys && Date.now() - cachedKeys.fetchedAt < KEYS_TTL_MS) {
    return cachedKeys.keys;
  }
  const response = await fetch(APPLE_KEYS_URL, { cache: "no-store" });
  if (!response.ok) throw new Error(`Apple keys request failed (${response.status})`);
  const json = (await response.json()) as { keys?: AppleKey[] };
  cachedKeys = { keys: Array.isArray(json.keys) ? json.keys : [], fetchedAt: Date.now() };
  return cachedKeys.keys;
}

function invalid(message: string) {
  return Object.assign(new Error(message), { code: "auth/invalid-id-token" });
}

function decodePart(part: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
}

/**
 * Verify an Apple identity token from the website's Sign in with Apple popup.
 * Apple gives a person the same "sub" in every app of the developer team, so
 * it matches the accounts the iOS apps created (login.social_token, provider apple).
 * Apple sends the name only on the first authorization, so it comes from the browser.
 */
export async function verifyAppleIdentity(
  idToken: string,
  expectedNonce: string,
  name: { first_name: string; last_name: string },
) {
  const clientId = process.env.NEXT_PUBLIC_APPLE_SERVICES_ID?.trim();
  if (!clientId) throw new Error("NEXT_PUBLIC_APPLE_SERVICES_ID is not configured");

  const parts = idToken.split(".");
  if (parts.length !== 3) throw invalid("Malformed Apple identity token.");
  let header: Record<string, unknown>;
  let claims: Record<string, unknown>;
  try {
    header = decodePart(parts[0]);
    claims = decodePart(parts[1]);
  } catch {
    throw invalid("Malformed Apple identity token.");
  }
  if (header.alg !== "RS256") throw invalid("Unexpected Apple token algorithm.");

  let jwk = (await appleKeys(false)).find((key) => key.kid === header.kid);
  if (!jwk) jwk = (await appleKeys(true)).find((key) => key.kid === header.kid);
  if (!jwk) throw invalid("Unknown Apple signing key.");

  const signedOk = verify(
    "RSA-SHA256",
    Buffer.from(`${parts[0]}.${parts[1]}`),
    createPublicKey({ key: jwk, format: "jwk" }),
    Buffer.from(parts[2], "base64url"),
  );
  const subject = typeof claims.sub === "string" ? claims.sub : "";
  const email = typeof claims.email === "string" ? claims.email.trim().toLowerCase() : "";
  const emailVerified = claims.email_verified === true || claims.email_verified === "true";
  if (
    !signedOk ||
    claims.iss !== APPLE_ISSUER ||
    claims.aud !== clientId ||
    typeof claims.exp !== "number" ||
    claims.exp * 1000 < Date.now() ||
    !expectedNonce ||
    claims.nonce !== expectedNonce ||
    !subject
  ) {
    throw invalid("Invalid Apple identity token.");
  }
  if (!email || !emailVerified) {
    throw Object.assign(new Error("Your Apple ID didn't share an email address."), {
      code: "auth/missing-email",
    });
  }

  return {
    provider: "apple" as const,
    id_token: idToken,
    // The PHP trusted-identity path requires an identity id; Apple sign-in
    // doesn't go through Firebase, so the Apple subject stands in for it.
    firebase_uid: subject,
    provider_subject: subject,
    email,
    first_name: name.first_name.trim().slice(0, 50),
    last_name: name.last_name.trim().slice(0, 50),
  };
}

export type AppleIdentity = Awaited<ReturnType<typeof verifyAppleIdentity>>;
