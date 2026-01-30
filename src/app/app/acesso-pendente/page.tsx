"use client";

import { useUser } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { useState } from "react";

export default function AcessoPendentePage() {
    const { user } = useUser();
    const [solicitado, setSolicitado] = useState(false);
    const [loading, setLoading] = useState(false);

    const solicitarAcesso = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/solicitar-acesso", {
                method: "POST",
            });

            if (response.ok) {
                setSolicitado(true);
            }
        } catch (error) {
            console.error("Erro ao solicitar acesso:", error);
        } finally {
            setLoading(false);
        }
    };

    // Verifica se já solicitou acesso
    const jasolicitou = user?.publicMetadata?.accessStatus === "pending";

    return (
        <main className="min-h-screen flex items-center justify-center bg-slate-950 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />

            <div className="relative z-10 w-full max-w-lg px-4">
                <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="bg-amber-600/20 px-8 py-6 border-b border-amber-500/30">
                        <div className="flex items-center justify-center gap-3">
                            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <h1 className="text-xl font-semibold text-center text-white">
                                Acesso Restrito
                            </h1>
                        </div>
                    </div>

                    <div className="p-8 space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "w-12 h-12",
                                    }
                                }}
                            />
                            <div>
                                <p className="text-white font-medium">{user?.fullName || "Usuário"}</p>
                                <p className="text-sm text-slate-400">{user?.emailAddresses[0]?.emailAddress}</p>
                            </div>
                        </div>

                        {solicitado || jasolicitou ? (
                            <div className="text-center space-y-4">
                                <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center">
                                    <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-lg font-medium text-white">Solicitação Enviada</h2>
                                    <p className="text-slate-400 mt-2">
                                        Sua solicitação de acesso foi enviada e está aguardando aprovação de um administrador.
                                    </p>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                    <p className="text-sm text-slate-500">
                                        Você receberá uma notificação quando seu acesso for aprovado.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center space-y-4">
                                <p className="text-slate-300">
                                    Você ainda não tem permissão para acessar o sistema. Solicite acesso a um administrador para continuar.
                                </p>

                                <button
                                    onClick={solicitarAcesso}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                            Solicitar Acesso
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="px-8 pb-6">
                        <p className="text-xs text-slate-500 text-center">
                            Entre em contato com o administrador se precisar de ajuda
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
