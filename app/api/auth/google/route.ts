import { NextRequest, NextResponse } from "next/server";
import { verifyGoogleIdentity } from "@/lib/google-identity";
import { clearGoogleOnboarding, startGoogleOnboarding } from "@/lib/google-onboarding";
import { phpFirebaseSocialLogin } from "@/lib/auth-php";
import { setSession } from "@/lib/auth-session";
import { getPublicRequestOrigin } from "@/lib/public-origin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  // Reject cross-origin browser requests before creating an application session.
  const origin = req.headers.get("origin");
  if (origin && origin !== getPublicRequestOrigin(req)) {
    return NextResponse.json({ success: false, message: "Invalid request origin." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.idToken !== "string" || !body.idToken ||
      (body.intent !== "login" && body.intent !== "register")) {
    return NextResponse.json({ success: false, message: "Invalid sign-in request." }, { status: 400 });
  }
  try {
    await clearGoogleOnboarding();
    const identity = await verifyGoogleIdentity(body.idToken);
    // The PHP lookup logs in known Google accounts without asking for extra fields.
    const result = await phpFirebaseSocialLogin({ ...identity, intent: "begin" });
    if (result.ok && "needsOnboarding" in result) {
      await startGoogleOnboarding(body.idToken);
      return NextResponse.json({
        success: true, needsOnboarding: true,
        next: "/user-registration/complete",
      });
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
    const invalidToken = ["auth/id-token-expired", "auth/id-token-revoked", "auth/invalid-id-token", "auth/argument-error", "auth/user-disabled", "auth/user-not-found"].includes(code);
    if (!invalidToken) console.error("[/api/auth/google] Google sign-in failed", code || "configuration/backend error");
    return NextResponse.json({
      success: false,
      message: invalidToken ? "Your Google sign-in expired. Please try again." : "Google sign-in is unavailable right now. Please use email and password.",
    }, { status: invalidToken ? 401 : 503 });
  }
}
