import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { verifyAppleIdentity } from "@/lib/apple-identity";
import { clearAppleOnboarding, clearGoogleOnboarding, startAppleOnboarding } from "@/lib/google-onboarding";
import { phpFirebaseSocialLogin } from "@/lib/auth-php";
import { setSession } from "@/lib/auth-session";
import { getPublicRequestOrigin } from "@/lib/public-origin";

export const runtime = "nodejs";

const NONCE_COOKIE = "apple_signin_nonce";

/** One-time nonce for the Apple sign-in popup; Apple puts it in the identity token. */
export async function GET() {
  const nonce = randomBytes(32).toString("hex");
  (await cookies()).set(NONCE_COOKIE, nonce, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/api/auth/apple", maxAge: 600,
  });
  return NextResponse.json({ nonce }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  // Reject cross-origin browser requests before creating an application session.
  const origin = req.headers.get("origin");
  if (origin && origin !== getPublicRequestOrigin(req)) {
    return NextResponse.json({ success: false, message: "Invalid request origin." }, { status: 403 });
  }

  const cookieStore = await cookies();
  const nonce = cookieStore.get(NONCE_COOKIE)?.value || "";
  cookieStore.delete({ name: NONCE_COOKIE, path: "/api/auth/apple" });

  const body = await req.json().catch(() => null);
  if (!body || typeof body.idToken !== "string" || !body.idToken || !nonce) {
    return NextResponse.json({ success: false, message: "Your Apple sign-in expired. Please try again." }, { status: 400 });
  }
  try {
    await clearAppleOnboarding();
    await clearGoogleOnboarding();
    const identity = await verifyAppleIdentity(body.idToken, nonce, {
      first_name: typeof body.firstName === "string" ? body.firstName : "",
      last_name: typeof body.lastName === "string" ? body.lastName : "",
    });
    // Apple IDs already linked (e.g. from the iOS apps) log straight in.
    const result = await phpFirebaseSocialLogin({ ...identity, intent: "begin" });
    if (result.ok && "needsOnboarding" in result) {
      await startAppleOnboarding(identity);
      return NextResponse.json({ success: true, needsOnboarding: true, next: "/user-registration/complete" });
    }
    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status });
    }
    await setSession({ auth_token: result.data.auth_token, user_id: result.data.user_id });
    return NextResponse.json({
      success: true,
      user: result.data.user,
      portalUrl: result.data.portalUrl,
      paidUser: result.data.paidUser,
    });
  } catch (error) {
    const code = (error as { code?: string })?.code || "";
    if (code === "auth/missing-email") {
      return NextResponse.json({
        success: false,
        message: "Your Apple ID didn't share an email address. Please sign in with your email and password.",
      }, { status: 400 });
    }
    const invalidToken = code === "auth/invalid-id-token";
    if (!invalidToken) console.error("[/api/auth/apple] Apple sign-in failed", error instanceof Error ? error.message : error);
    return NextResponse.json({
      success: false,
      message: invalidToken ? "Your Apple sign-in expired. Please try again." : "Apple sign-in is unavailable right now. Please use email and password.",
    }, { status: invalidToken ? 401 : 503 });
  }
}
