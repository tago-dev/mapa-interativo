import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const user = await currentUser();

    if (!user) {
        redirect("/login");
    }

    // Verifica status de acesso
    const accessStatus = user.publicMetadata?.accessStatus as string | undefined;
    const isAdmin = user.publicMetadata?.role === "admin";
    const hasAccess = accessStatus === "approved" || isAdmin;

    // Se não tem acesso e não está na página de acesso pendente, redireciona
    const isAccessPendingPage = false; // Será verificado no componente filho

    return (
        <div className="min-h-screen flex flex-col bg-slate-100">
            <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-800 px-6 py-3 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <Link href="/app/mapa" className="font-semibold text-white text-lg hover:text-slate-300 transition-colors">
                        Sistema de Monitoramento
                    </Link>
                    {hasAccess && (
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
                            {isAdmin && (
                                <Link
                                    href="/app/admin/relatorios"
                                    className="text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    Relatórios
                                </Link>
                            )}
                            {isAdmin && (
                                <Link
                                    href="/app/admin/usuarios"
                                    className="text-sm text-slate-400 hover:text-white transition-colors"
                                >
                                    Usuários
                                </Link>
                            )}
                        </nav>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-500 hidden md:block">
                        {user.emailAddresses[0]?.emailAddress}
                    </span>
                    <UserButton
                        afterSignOutUrl="/login"
                        appearance={{
                            elements: {
                                avatarBox: "w-8 h-8",
                            }
                        }}
                    />
                </div>
            </header>


            <main className="flex-1 pt-[52px]">{children}</main>
        </div>
    );
}
