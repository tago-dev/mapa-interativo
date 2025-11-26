"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { fetchAllCities, upsertCityData } from "@/utils/supabase/city";
import { Cidade } from "@/types/types";

type GeoFeature = {
    id?: string | number;
    properties: {
        id?: string | number;
        name: string;
        mesorregiao: string;
        [key: string]: unknown;
    };
};

export default function AdminDashboard() {
    const [geoCities, setGeoCities] = useState<GeoFeature[]>([]);
    const [dbCities, setDbCities] = useState<Cidade[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<"all" | "registered" | "pending">("all");
    const [filterMesorregiao, setFilterMesorregiao] = useState<string>("all");
    const [registeringIds, setRegisteringIds] = useState<Set<string>>(new Set());

    const loadData = useCallback(async () => {
        try {
            const res = await fetch("/data/municipios.json");
            const data = await res.json();
            const features = data.features || [];
            setGeoCities(features);

            const registered = await fetchAllCities();
            setDbCities(registered);
        } catch (error) {
            console.error("Erro ao carregar dashboard:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Função para registrar cidade rapidamente
    const handleQuickRegister = async (feature: GeoFeature) => {
        const id = String(feature.id || feature.properties.id);

        setRegisteringIds(prev => new Set(prev).add(id));

        try {
            await upsertCityData({
                id: id,
                name: feature.properties.name,
                mesorregiao: feature.properties.mesorregiao,
            });

            // Recarrega os dados
            const registered = await fetchAllCities();
            setDbCities(registered);
        } catch (error) {
            console.error("Erro ao registrar cidade:", error);
            alert("Erro ao registrar cidade. Tente novamente.");
        } finally {
            setRegisteringIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
        }
    };

    // Extrair mesorregiões únicas
    const mesorregioes = useMemo(() => {
        const set = new Set(geoCities.map(f => f.properties.mesorregiao).filter(Boolean));
        return Array.from(set).sort();
    }, [geoCities]);

    // Estatísticas
    const stats = useMemo(() => {
        const total = geoCities.length;
        const registered = geoCities.filter(f => {
            const id = f.id || f.properties.id;
            return dbCities.some(c => String(c.id) === String(id));
        }).length;
        const pending = total - registered;
        const percentage = total > 0 ? Math.round((registered / total) * 100) : 0;
        return { total, registered, pending, percentage };
    }, [geoCities, dbCities]);

    // Filtragem
    const filteredCities = useMemo(() => {
        return geoCities.filter(feature => {
            const id = feature.id || feature.properties.id;
            const name = feature.properties.name.toLowerCase();
            const isRegistered = dbCities.some(c => String(c.id) === String(id));

            // Filtro de busca
            if (searchTerm && !name.includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Filtro de status
            if (filterStatus === "registered" && !isRegistered) return false;
            if (filterStatus === "pending" && isRegistered) return false;

            // Filtro de mesorregião
            if (filterMesorregiao !== "all" && feature.properties.mesorregiao !== filterMesorregiao) {
                return false;
            }

            return true;
        });
    }, [geoCities, dbCities, searchTerm, filterStatus, filterMesorregiao]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-600 font-medium">Carregando painel administrativo...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                            </div>
                            Painel Administrativo
                        </h1>
                        <p className="text-slate-500 mt-1">Gerencie os dados de todas as cidades do Paraná</p>
                    </div>
                    <Link
                        href="/app/mapa"
                        className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm transition-all"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Voltar ao Mapa
                    </Link>
                </div>

                {/* Cards de Estatísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Total de Cidades</p>
                                <p className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</p>
                            </div>
                            <div className="bg-slate-100 p-3 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Registradas</p>
                                <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.registered}</p>
                            </div>
                            <div className="bg-emerald-100 p-3 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Pendentes</p>
                                <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                            </div>
                            <div className="bg-amber-100 p-3 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">Progresso</p>
                                <p className="text-3xl font-bold text-cyan-600 mt-1">{stats.percentage}%</p>
                            </div>
                            <div className="bg-cyan-100 p-3 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                        </div>
                        {/* Barra de progresso */}
                        <div className="mt-3 w-full bg-slate-100 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${stats.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Busca */}
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Buscar cidade..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                            />
                        </div>

                        {/* Filtro de Status */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">Status:</span>
                            <div className="flex bg-slate-100 rounded-lg p-1">
                                <button
                                    onClick={() => setFilterStatus("all")}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
                                >
                                    Todas
                                </button>
                                <button
                                    onClick={() => setFilterStatus("registered")}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === "registered" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
                                >
                                    Registradas
                                </button>
                                <button
                                    onClick={() => setFilterStatus("pending")}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${filterStatus === "pending" ? "bg-white text-amber-700 shadow-sm" : "text-slate-600 hover:text-slate-800"}`}
                                >
                                    Pendentes
                                </button>
                            </div>
                        </div>

                        {/* Filtro de Mesorregião */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-600">Mesorregião:</span>
                            <select
                                value={filterMesorregiao}
                                onChange={(e) => setFilterMesorregiao(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                            >
                                <option value="all">Todas</option>
                                {mesorregioes.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Contador de resultados */}
                    <div className="mt-3 text-sm text-slate-500">
                        Exibindo <span className="font-semibold text-slate-700">{filteredCities.length}</span> de <span className="font-semibold text-slate-700">{stats.total}</span> cidades
                    </div>
                </div>

                {/* Tabela */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Cidade</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mesorregião</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {filteredCities.map((feature, index) => {
                                    const id = feature.id || feature.properties.id;
                                    const name = feature.properties.name;
                                    const isRegistered = dbCities.some(c => String(c.id) === String(id));

                                    return (
                                        <tr
                                            key={id}
                                            className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${isRegistered ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                    <span className="text-sm font-medium text-slate-900">{name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-slate-600">{feature.properties.mesorregiao || "—"}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isRegistered ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Registrado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        Pendente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!isRegistered && (
                                                        <button
                                                            onClick={() => handleQuickRegister(feature)}
                                                            disabled={registeringIds.has(String(id))}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-all"
                                                        >
                                                            {registeringIds.has(String(id)) ? (
                                                                <>
                                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Registrando...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                                    </svg>
                                                                    Registrar
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/app/admin/cidade/${encodeURIComponent(String(id || ""))}`}
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${isRegistered
                                                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        {isRegistered ? 'Editar' : 'Detalhes'}
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Empty state */}
                    {filteredCities.length === 0 && (
                        <div className="text-center py-12">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-slate-500 font-medium">Nenhuma cidade encontrada</p>
                            <p className="text-slate-400 text-sm mt-1">Tente ajustar os filtros de busca</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
