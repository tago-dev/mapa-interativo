"use client";
import React, { useState, useMemo, Suspense } from "react";
export const dynamic = "force-dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [senha, setSenha] = useState("");
    const [loading, setLoading] = useState(false);
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
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password: senha,
        });
        setLoading(false);
        if (error) return alert(error.message);
        router.push(redirectTo);
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-100">
            <form
                onSubmit={entrar}
                className="bg-white text-black shadow-xl rounded-2xl p-8 w-full max-w-sm"
            >
                <h1 className="text-2xl font-bold mb-6 text-center text-black">Acesso Restrito</h1>

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border w-full p-3 rounded-xl mb-4"
                    required
                />
                <input
                    type="password"
                    placeholder="Senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    className="border w-full p-3 rounded-xl mb-4"
                    required
                />

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-black text-white w-full py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-50"
                >
                    {loading ? "Entrando..." : "Entrar"}
                </button>
            </form>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<main className="min-h-screen flex items-center justify-center bg-gray-100">Carregando...</main>}>
            <LoginForm />
        </Suspense>
    );
}