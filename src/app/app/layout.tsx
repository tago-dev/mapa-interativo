import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    // Guarda todas as rotas /app/* no servidor como fallback, além do middleware
    const supabase = createServerComponentClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        // Evita loop e manda pro login; após login, a página padrão é /app/mapa
        redirect("/login?redirectedFrom=/app");
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-100">
            <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 shadow-lg px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {/* Ícone do mapa */}
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                    </div>
                    <Link href="/app/mapa" className="font-bold text-white text-xl tracking-tight hover:text-white/90 transition-colors">
                        Mapa Interativo
                    </Link>
                    <span className="hidden sm:inline-block bg-white/20 text-white/90 text-xs font-medium px-2 py-1 rounded-full">
                        Paraná
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    {/* Link para Admin */}
                    <Link
                        href="/app/admin"
                        className="flex items-center gap-1.5 text-sm text-white/90 hover:text-white transition-colors"
                    >
                        <div className="bg-white/20 p-1.5 rounded-lg">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <span className="hidden sm:inline font-medium">Admin</span>
                    </Link>

                    <div className="h-6 w-px bg-white/30"></div>

                    <Link href="/app/perfil" className="text-sm text-white/90 hover:text-white flex items-center gap-2 transition-colors">
                        {/* Ícone do usuário */}
                        <div className="bg-white/20 p-1.5 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        </div>
                        <span className="hidden sm:inline font-medium">{session.user.email}</span>
                    </Link>
                    <div className="h-6 w-px bg-white/30"></div>
                    <Link
                        href="/app/sair"
                        className="flex items-center gap-1.5 text-sm bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg font-medium transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Sair
                    </Link>
                </div>
            </header>

            <main className="flex-1 pt-[72px]">{children}</main>
        </div>
    );
}
