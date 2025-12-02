import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isProtectedRoute = pathname.startsWith("/app");
  const isLogoutRoute = pathname === "/app/sair";

  if (!session && isProtectedRoute && !isLogoutRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl, { headers: res.headers });
  }

  if (session && isLoginPage) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/app/mapa";
    return NextResponse.redirect(redirectUrl, { headers: res.headers });
  }

  return res;
}

export const config = {
  matcher: ["/login", "/app/:path*"],
};
