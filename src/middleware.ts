import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/app(.*)"]);
const isAccessPendingRoute = createRouteMatcher(["/app/acesso-pendente"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { userId, sessionClaims } = await auth.protect();

    // Verifica status de acesso nos metadados públicos
    const metadata = sessionClaims?.metadata as { accessStatus?: string; role?: string } | undefined;
    const accessStatus = metadata?.accessStatus;
    const role = metadata?.role;
    const hasAccess = accessStatus === "approved" || role === "admin";

    // Se não tem acesso e não está na página de acesso pendente
    if (!hasAccess && !isAccessPendingRoute(req)) {
      const url = new URL("/app/acesso-pendente", req.url);
      return NextResponse.redirect(url);
    }

    // Se tem acesso e está na página de acesso pendente, redireciona para o mapa
    if (hasAccess && isAccessPendingRoute(req)) {
      const url = new URL("/app/mapa", req.url);
      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
