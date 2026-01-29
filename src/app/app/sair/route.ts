import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Com o Clerk, o logout é gerenciado pelo componente SignOutButton ou UserButton
  // Esta rota apenas redireciona para a página de login
  const base = req.nextUrl.origin;
  return NextResponse.redirect(new URL("/login", base));
}
