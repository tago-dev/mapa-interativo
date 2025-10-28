import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Cria cliente Supabase vinculado ao cookie
  const supabase = createMiddlewareClient({ req, res });

  // Pega sessão ativa
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;
  const isLoginPage = pathname === "/login";
  const isProtectedRoute = pathname.startsWith("/app");
  const isLogoutRoute = pathname === "/app/sair";

  // Usuário não logado tentando acessar /app
  if (!session && isProtectedRoute && !isLogoutRoute) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("redirectedFrom", req.nextUrl.pathname);
    // Preserve any auth cookies set by Supabase on this middleware run
    return NextResponse.redirect(redirectUrl, { headers: res.headers });
  }

  // Usuário já logado acessando /login
  if (session && isLoginPage) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = "/app/mapa";
    return NextResponse.redirect(redirectUrl, { headers: res.headers });
  }

  return res;
}

// Garante que o middleware só intercepta o que precisa
export const config = {
  matcher: ["/login", "/app/:path*"],
};
