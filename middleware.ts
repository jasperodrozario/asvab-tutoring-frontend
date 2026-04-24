// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { handleReferral } from "./middleware/referralTracker";

export function middleware(request: NextRequest) {
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");
  const isLoginPage = request.nextUrl.pathname === "/login";
  const isAuthenticated = request.cookies.get("admin-auth")?.value === "true";

  if (isAdminPage && !isLoginPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let response = NextResponse.next();

  // Handle Referral Logic
  response = handleReferral(request, response);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
