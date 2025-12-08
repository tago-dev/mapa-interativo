import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => Promise.resolve(cookieStore) });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        redirect("/login");
    }

    const user = session.user;

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-2xl font-bold text-slate-800 mb-6">Meu Perfil</h1>

                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100">
                        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">
                            Informações do Usuário
                        </h3>
                    </div>
                    <div className="divide-y divide-slate-100">
                        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center">
                            <span className="text-sm text-slate-500 sm:w-40">Email</span>
                            <span className="text-sm text-slate-800 font-medium mt-1 sm:mt-0">{user.email}</span>
                        </div>
                        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center">
                            <span className="text-sm text-slate-500 sm:w-40">ID do Usuário</span>
                            <span className="text-sm text-slate-800 font-mono mt-1 sm:mt-0">{user.id}</span>
                        </div>
                        <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center">
                            <span className="text-sm text-slate-500 sm:w-40">Último Login</span>
                            <span className="text-sm text-slate-800 mt-1 sm:mt-0">
                                {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'N/A'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
