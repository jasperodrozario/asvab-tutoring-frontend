// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { handleReferral } from "./middleware/referralTracker";

const CANONICAL_HOST = "asvab-tutoring.com";
const ALTERNATE_HOSTS = new Set([
  "www.asvab-tutoring.com",
  "new.asvab-tutoring.com",
  "www.new.asvab-tutoring.com",
]);

function getRequestHost(request: NextRequest): string {
  return (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
}

function redirectToCanonicalHost(request: NextRequest): NextResponse {
  const destination = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
    `https://${CANONICAL_HOST}`,
  );

  return NextResponse.redirect(destination, 301);
}

export function middleware(request: NextRequest) {
  if (ALTERNATE_HOSTS.has(getRequestHost(request))) {
    return redirectToCanonicalHost(request);
  }

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
  // Run on all routes so alternate hosts always redirect, including /favicon.ico etc.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
