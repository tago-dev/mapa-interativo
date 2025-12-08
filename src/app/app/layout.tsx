import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    // Guarda todas as rotas /app/* no servidor como fallback, além do middleware
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        // Evita loop e manda pro login; após login, a página padrão é /app/mapa
        redirect("/login?redirectedFrom=/app");
    }

    return (
        <div className="min-h-screen flex flex-col bg-slate-100">
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <Link href="/app/mapa" className="font-semibold text-white text-lg hover:text-slate-300 transition-colors">
                        Sistema de Monitoramento
                    </Link>
                    <nav className="hidden sm:flex items-center gap-4">
                        <Link
                            href="/app/mapa"
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Mapa
                        </Link>
                        <Link
                            href="/app/admin"
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            Admin
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 hidden md:block">{user.email}</span>
                    <Link
                        href="/app/sair"
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        Sair
                    </Link>
                </div>
            </header>


            <main className="flex-1 pt-[52px]">{children}</main>
        </div>
    );
}
