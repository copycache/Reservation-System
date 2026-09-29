import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token");
  const { pathname } = request.nextUrl;

  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/auth/login";
  const isApiRoute = pathname.startsWith("/api");

  if (token) {
    try {
      const userResponse = await fetch(
        new URL("/api/user", request.url),
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token.value}`,
          },
          cache: "no-store",
        }
      );

      if (!userResponse.ok) {
        const response = isApiRoute
          ? NextResponse.next()
          : NextResponse.redirect(
              new URL("/auth/login", request.url)
            );

        response.cookies.delete("auth_token");
        response.cookies.delete("user_role");

        return response;
      }
    } catch {
    }
  }

  if (isApiRoute) {
    const requestHeaders = new Headers(request.headers);
    if (token) {
      requestHeaders.set(
        "Authorization",
        `Bearer ${token.value}`
      );
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