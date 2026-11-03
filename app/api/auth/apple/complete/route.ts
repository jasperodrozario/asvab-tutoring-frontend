import { NextRequest, NextResponse } from "next/server";
import { clearAppleOnboarding, getAppleOnboardingIdentity } from "@/lib/google-onboarding";
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
  const identity = await getAppleOnboardingIdentity();
  if (!identity) {
    return NextResponse.json({ success: false, expired: true, message: "Your Apple sign-in has expired. Please start again." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body || body.termsAccepted !== true) {
    return NextResponse.json({ success: false, message: "Please accept the Terms of Service and Privacy Policy." }, { status: 400 });
  }
  const mobile = typeof body.mobile === "string" ? body.mobile.replace(/\D/g, "") : "";
  const mobileError = validateRegistrationMobile(mobile);
  if (mobileError) {
    return NextResponse.json({ success: false, message: mobileError }, { status: 400 });
  }

  if (!identity.first_name.trim()) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ success: false, message: "Please enter your full name." }, { status: 400 });
    }
    const [firstName, ...lastName] = name.split(/\s+/);
    identity.first_name = firstName.slice(0, 50);
    identity.last_name = lastName.join(" ").slice(0, 50);
  }

  try {
    const result = await phpFirebaseSocialLogin({ ...identity, intent: "register", mobile });
    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.message }, { status: result.status });
    }
    if ("needsOnboarding" in result) {
      return NextResponse.json({ success: false, message: "Unable to complete registration. Please try again." }, { status: 502 });
    }
    await setSession({ auth_token: result.data.auth_token, user_id: result.data.user_id });
    await clearAppleOnboarding();
    return NextResponse.json({ success: true, user: result.data.user, portalUrl: result.data.portalUrl, paidUser: result.data.paidUser });
  } catch (error) {
    console.error("[/api/auth/apple/complete] Registration failed", error instanceof Error ? error.message : error);
    return NextResponse.json({ success: false, message: "Unable to finish registration right now. Please try again." }, { status: 503 });
  }
}

export async function DELETE(req: NextRequest) {
  if (invalidOrigin(req)) {
    return NextResponse.json({ success: false }, { status: 403 });
  }
  await clearAppleOnboarding();
  return NextResponse.json({ success: true });
}
