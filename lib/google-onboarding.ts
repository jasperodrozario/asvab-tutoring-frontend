import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { AppleIdentity } from "@/lib/apple-identity";

const COOKIE = "asvab_google_onboarding";
const APPLE_COOKIE = "asvab_apple_onboarding";
const MAX_AGE = 10 * 60;

function key() {
  const secret = process.env.AUTH_SESSION_SECRET?.trim() || process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) throw new Error("An authentication session secret is required");
  return createHash("sha256").update("asvab/google-onboarding/v1\0").update(secret).digest();
}

async function seal(name: string, data: Record<string, unknown>) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const payload = JSON.stringify({ ...data, expiresAt: Date.now() + MAX_AGE * 1000 });
  const ciphertext = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const value = [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
  if (value.length > 3800) throw new Error("Sign-in identity exceeds onboarding cookie size");
  (await cookies()).set(name, value, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
}

async function unseal(name: string): Promise<Record<string, unknown> | null> {
  const value = (await cookies()).get(name)?.value;
  if (!value) return null;
  try {
    const parts = value.split(".");
    if (parts.length !== 3) return null;
    const [iv, tag, ciphertext] = parts.map((part) => Buffer.from(part, "base64url"));
    if (iv.length !== 12 || tag.length !== 16) return null;
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
    const payload = JSON.parse(plaintext);
    if (typeof payload.expiresAt !== "number" || payload.expiresAt <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Separate, short-lived identity proof. This cookie never grants application access. */
export async function startGoogleOnboarding(idToken: string) {
  await seal(COOKIE, { idToken });
}

export async function getGoogleOnboardingToken(): Promise<string | null> {
  const payload = await unseal(COOKIE);
  return payload && typeof payload.idToken === "string" && payload.idToken ? payload.idToken : null;
}

export async function clearGoogleOnboarding() {
  (await cookies()).delete(COOKIE);
}

/**
 * Apple's identity token is bound to a one-time nonce, so it can't be verified
 * again later; the identity verified at sign-in is kept (encrypted) instead.
 */
export async function startAppleOnboarding(identity: AppleIdentity) {
  await seal(APPLE_COOKIE, { identity });
}

export async function getAppleOnboardingIdentity(): Promise<AppleIdentity | null> {
  const identity = (await unseal(APPLE_COOKIE))?.identity as AppleIdentity | undefined;
  return identity?.provider === "apple" && identity.provider_subject && identity.email ? identity : null;
}

export async function clearAppleOnboarding() {
  (await cookies()).delete(APPLE_COOKIE);
}
