import { NextRequest, NextResponse } from "next/server";
import { getGoogleOnboardingToken, clearGoogleOnboarding } from "@/lib/google-onboarding";
import { verifyGoogleIdentity } from "@/lib/google-identity";
import { phpFirebaseSocialLogin } from "@/lib/auth-php";
import { setSession } from "@/lib/auth-session";
import { getPublicRequestOrigin } from "@/lib/public-origin";
import { validateRegistrationMobile } from "@/lib/sanitize-mobile-input";

export const runtime = "nodejs";

function invalidOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  return origin && origin !== getPublicRequestOrigin(req);
}

export async function POST(req: NextRequest) {
  if (invalidOrigin(req)) {
    return NextResponse.json({ success: false, message: "Invalid request origin." }, { status: 403 });
  }
  const idToken = await getGoogleOnboardingToken();
  if (!idToken) {
    return NextResponse.json({ success: false, expired: true, message: "Your Google sign-in has expired. Please start again." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || body.termsAccepted !== true) {
    return NextResponse.json({ success: false, message: "Please accept the Terms & Conditions and Privacy Policy." }, { status: 400 });
  }
  const mobile = typeof body.mobile === "string" ? body.mobile.replace(/\D/g, "") : "";
  const mobileError = validateRegistrationMobile(mobile);
  if (mobileError) {
    return NextResponse.json({ success: false, message: mobileError }, { status: 400 });
  }

  try {
    // Recheck the original Google proof, including revocation, before creating a user.
    const identity = await verifyGoogleIdentity(idToken);
    const result = await phpFirebaseSocialLogin({ ...identity, intent: "register", mobile });
    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status });
    }
    if ("needsOnboarding" in result) {
      return NextResponse.json({ success: false, message: "Unable to complete registration. Please try again." }, { status: 502 });
    }
    await setSession({ auth_token: result.data.auth_token, user_id: result.data.user_id });
    await clearGoogleOnboarding();
    return NextResponse.json({ success: true, user: result.data.user, portalUrl: result.data.portalUrl, paidUser: result.data.paidUser });
  } catch (error) {
    const code = (error as { code?: string })?.code || "";
    const invalidToken = ["auth/id-token-expired", "auth/id-token-revoked", "auth/invalid-id-token", "auth/argument-error", "auth/user-disabled", "auth/user-not-found"].includes(code);
    if (invalidToken) await clearGoogleOnboarding();
    else console.error("[/api/auth/google/complete] Registration failed", code || "configuration/backend error");
    return NextResponse.json({
      success: false,
      expired: invalidToken,
      message: invalidToken ? "Your Google sign-in has expired. Please start again." : "Unable to finish registration right now. Please try again.",
    }, { status: invalidToken ? 401 : 503 });
  }
}

export async function DELETE(req: NextRequest) {
  if (invalidOrigin(req)) {
    return NextResponse.json({ success: false }, { status: 403 });
  }
  await clearGoogleOnboarding();
  return NextResponse.json({ success: true });
}
