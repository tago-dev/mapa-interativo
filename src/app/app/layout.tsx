import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

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
                <Link href="/app/mapa" className="font-semibold text-gray-800">
                    Mapa Interativo
                </Link>
                <Link
                    href="/app/sair"
                    className="text-sm bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600"
                >
                    Sair
                </Link>
            </header>

            <main className="flex-1">{children}</main>
        </div>
    );
}
