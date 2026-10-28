import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "asvab_google_onboarding";
const MAX_AGE = 10 * 60;

function key() {
  const secret = process.env.AUTH_SESSION_SECRET?.trim() || process.env.INTERNAL_API_SECRET?.trim();
  if (!secret) throw new Error("An authentication session secret is required");
  return createHash("sha256").update("asvab/google-onboarding/v1\0").update(secret).digest();
}

/** Separate, short-lived identity proof. This cookie never grants application access. */
export async function startGoogleOnboarding(idToken: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const payload = JSON.stringify({ idToken, expiresAt: Date.now() + MAX_AGE * 1000 });
  const ciphertext = Buffer.concat([cipher.update(payload, "utf8"), cipher.final()]);
  const value = [iv, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
  if (value.length > 3800) throw new Error("Google identity exceeds onboarding cookie size");
  (await cookies()).set(COOKIE, value, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
}

export async function getGoogleOnboardingToken(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE)?.value;
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
    if (typeof payload.expiresAt !== "number" || payload.expiresAt <= Date.now() ||
        typeof payload.idToken !== "string" || !payload.idToken) return null;
    return payload.idToken;
  } catch {
    return null;
  }
}

export async function clearGoogleOnboarding() {
  (await cookies()).delete(COOKIE);
}
