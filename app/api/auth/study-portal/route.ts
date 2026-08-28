import { NextRequest, NextResponse } from "next/server";
import { phpAuthTokenLookupDetailed } from "@/lib/auth-php";
import { getSession } from "@/lib/auth-session";
import { resolvePortalLoginUrl } from "@/lib/portal-login";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const loginUrl = new URL("/user-login", req.url);

  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.redirect(loginUrl);
    }

    const lookedUp = await phpAuthTokenLookupDetailed(session.auth_token);
    if (!lookedUp || lookedUp.user.user_id !== session.user_id) {
      return NextResponse.redirect(loginUrl);
    }

    if (!lookedUp.portalUrl) {
      console.error(
        "[/api/auth/study-portal] auth-token-lookup returned no portal login url",
      );
    }

    const dest = NextResponse.redirect(resolvePortalLoginUrl(lookedUp.portalUrl));
    dest.headers.set("Cache-Control", "no-store");
    return dest;
  } catch (err) {
    console.error("[/api/auth/study-portal]", err);
    return NextResponse.redirect(loginUrl);
  }
}
