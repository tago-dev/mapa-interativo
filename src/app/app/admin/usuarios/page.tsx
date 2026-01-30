"use client";

import { useState, useEffect, useCallback } from "react";

type Usuario = {
    id: string;
    email: string;
    name: string;
    imageUrl: string;
    accessStatus: string;
    accessRequestedAt?: string;
    role?: string;
};

export default function GerenciarUsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [filtro, setFiltro] = useState<"all" | "pending" | "approved" | "rejected">("all");

    const carregarUsuarios = useCallback(async () => {
        try {
            const response = await fetch("/api/admin/usuarios");
            if (response.ok) {
                const data = await response.json();
                setUsuarios(data.users);
            }
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregarUsuarios();
    }, [carregarUsuarios]);

    const gerenciarAcesso = async (userId: string, action: "approve" | "reject" | "revoke") => {
        setActionLoading(userId);
        try {
            const response = await fetch("/api/admin/usuarios", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, action }),
            });

            if (response.ok) {
                await carregarUsuarios();
            }
        } catch (error) {
            console.error("Erro ao gerenciar acesso:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const usuariosFiltrados = usuarios.filter((u) => {
        if (filtro === "all") return true;
        return u.accessStatus === filtro;
    });

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; label: string }> = {
            approved: { bg: "bg-green-500/20", text: "text-green-400", label: "Aprovado" },
            pending: { bg: "bg-amber-500/20", text: "text-amber-400", label: "Pendente" },
            rejected: { bg: "bg-red-500/20", text: "text-red-400", label: "Rejeitado" },
            revoked: { bg: "bg-gray-500/20", text: "text-gray-400", label: "Revogado" },
            none: { bg: "bg-slate-500/20", text: "text-slate-400", label: "Sem solicitação" },
        };
        const badge = badges[status] || badges.none;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {badge.label}
            </span>
        );
    };

    const pendingCount = usuarios.filter((u) => u.accessStatus === "pending").length;

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Gerenciar Usuários</h1>
                        <p className="text-slate-400 mt-1">Aprove ou rejeite solicitações de acesso</p>
                    </div>
                    {pendingCount > 0 && (
                        <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg px-4 py-2">
                            <span className="text-amber-400 font-medium">
                                {pendingCount} solicitação{pendingCount > 1 ? "ões" : ""} pendente{pendingCount > 1 ? "s" : ""}
                            </span>
                        </div>
                    )}
                </div>

                {/* Filtros */}
                <div className="flex gap-2 mb-6">
                    {(["all", "pending", "approved", "rejected"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFiltro(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filtro === f
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                }`}
                        >
                            {f === "all" && "Todos"}
                            {f === "pending" && `Pendentes (${usuarios.filter((u) => u.accessStatus === "pending").length})`}
                            {f === "approved" && "Aprovados"}
                            {f === "rejected" && "Rejeitados"}
                        </button>
                    ))}
                </div>

                {/* Lista de usuários */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    {usuariosFiltrados.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            Nenhum usuário encontrado
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-800">
                            {usuariosFiltrados.map((usuario) => (
                                <div key={usuario.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={usuario.imageUrl}
                                            alt={usuario.name}
                                            className="w-10 h-10 rounded-full"
                                        />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-white font-medium">{usuario.name}</p>
                                                {usuario.role === "admin" && (
                                                    <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">
                                                        Admin
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-400">{usuario.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        {getStatusBadge(usuario.accessStatus)}

                                        {usuario.accessStatus === "pending" && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => gerenciarAcesso(usuario.id, "approve")}
                                                    disabled={actionLoading === usuario.id}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    Aprovar
                                                </button>
                                                <button
                                                    onClick={() => gerenciarAcesso(usuario.id, "reject")}
                                                    disabled={actionLoading === usuario.id}
                                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                                >
                                                    Rejeitar
                                                </button>
                                            </div>
                                        )}

                                        {usuario.accessStatus === "approved" && usuario.role !== "admin" && (
                                            <button
                                                onClick={() => gerenciarAcesso(usuario.id, "revoke")}
                                                disabled={actionLoading === usuario.id}
                                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                Revogar
                                            </button>
                                        )}

                                        {(usuario.accessStatus === "rejected" || usuario.accessStatus === "revoked") && (
                                            <button
                                                onClick={() => gerenciarAcesso(usuario.id, "approve")}
                                                disabled={actionLoading === usuario.id}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                Aprovar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
