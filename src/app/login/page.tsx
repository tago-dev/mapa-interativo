"use client";
import React, { useState, useMemo, Suspense } from "react";
export const dynamic = "force-dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClientComponentClient();

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

            {/* Glow effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-md px-4">
                {/* Card principal */}
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-slate-800/50 px-8 py-6 border-b border-slate-700/50">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>
                        <h1 className="text-xl font-semibold text-center text-white">
                            Área Restrita
                        </h1>
                        <p className="text-sm text-slate-400 text-center mt-1">
                            Acesso exclusivo para usuários autorizados
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={entrar} className="p-8 space-y-5">
                        {erro && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 flex items-center gap-3">
                                <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span className="text-red-400 text-sm">{erro}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                                E-mail
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                    </svg>
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="senha" className="block text-sm font-medium text-slate-300">
                                Senha
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                </div>
                                <input
                                    id="senha"
                                    type="password"
                                    placeholder="••••••••"
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    className="w-full bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Autenticando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                    Acessar Sistema
                                </>
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="px-8 pb-6">
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Conexão segura e criptografada
                        </div>
                    </div>
                </div>

                {/* Aviso de segurança */}
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
                <div className="flex items-center gap-3 text-slate-400">
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Carregando...
                </div>
            </main>
        }>
            <LoginForm />
        </Suspense>
    );
}