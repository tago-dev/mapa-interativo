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
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-white border-b shadow-sm p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Link href="/app/mapa" className="font-semibold text-gray-800 text-lg">
                        Mapa Interativo
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/app/perfil" className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-2">
                        <span>{session.user.email}</span>
                    </Link>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <Link
                        href="/app/sair"
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                        Sair
                    </Link>
                </div>
            </header>

            <main className="flex-1">{children}</main>
        </div>
    );
}
