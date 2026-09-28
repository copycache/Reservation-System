import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token");

  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/auth/login";

  const isApiRoute = pathname.startsWith("/api");

  if (isApiRoute) {
    const requestHeaders = new Headers(request.headers);
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token.value}`);
    }
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (isAdminRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && token) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/auth/login", "/api/:path*"],
};