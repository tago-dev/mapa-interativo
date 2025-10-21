import { NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLogin = req.nextUrl.pathname === "/login";
  const isProtected = req.nextUrl.pathname.startsWith("/app");

  // Se não logado e tentando acessar /app → manda pra /login
  if (!user && isProtected) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Se logado e tentando ir pra /login → manda pro /app/mapa
  if (user && isLogin) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/app/mapa";
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: ["/login", "/app/:path*"],
};
