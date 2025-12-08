"use client";
import React, { useState, useMemo, Suspense } from "react";
export const dynamic = "force-dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const redirectTo = useMemo(() => {
        const raw = searchParams.get("redirectedFrom");
        // Normaliza destino: se vier "/app" (que não tem page), envia para "/app/mapa"
        if (!raw || raw === "/app") return "/app/mapa";
        return raw;
    }, [searchParams]);

    const entrar = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro("");
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: senha,
        });
        setLoading(false);
        if (error) {
            setErro("Credenciais inválidas. Verifique seus dados.");
            return;
        }
        router.push(redirectTo);
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-md px-4">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="bg-slate-800/50 px-8 py-6 border-b border-slate-700/50">
                        <h1 className="text-xl font-semibold text-center text-white">
                            Área Restrita
                        </h1>
                        <p className="text-sm text-slate-400 text-center mt-1">
                            Acesso exclusivo para usuários autorizados
                        </p>
                    </div>

                    <form onSubmit={entrar} className="p-8 space-y-5">
                        {erro && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                                <span className="text-red-400 text-sm">{erro}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                                E-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                required
                                suppressHydrationWarning
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="senha" className="block text-sm font-medium text-slate-300">
                                Senha
                            </label>
                            <input
                                id="senha"
                                type="password"
                                placeholder="••••••••"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 rounded-lg py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                required
                                suppressHydrationWarning
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                        >
                            {loading ? "Autenticando..." : "Acessar Sistema"}
                        </button>
                    </form>

                    <div className="px-8 pb-6">
                        <p className="text-xs text-slate-500 text-center">Conexão segura e criptografada</p>
                    </div>
                </div>

                <p className="text-center text-xs text-slate-600 mt-6">
                    Este sistema é monitorado. Tentativas de acesso não autorizado serão registradas.
                </p>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <main className="min-h-screen flex items-center justify-center bg-slate-950">
                <span className="text-slate-400">Carregando...</span>
            </main>
        }>
            <LoginForm />
        </Suspense>
    );
}