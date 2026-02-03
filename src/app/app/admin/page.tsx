"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { fetchAllCities, upsertCityData, bulkUpsertCities, bulkUpdateCities, bulkInsertVereadores, deleteAllVereadores } from "@/utils/supabase/city";
import { Cidade, Vereador } from "@/types/types";
import CSVUploadModal from "./components/CSVUploadModal";
import CSVVereadoresModal from "./components/CSVVereadoresModal";
import CSVParanaImportModal from "./components/CSVParanaImportModal";
import CSVEleitoresImportModal from "./components/CSVEleitoresImportModal";

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
    const [filterStatus, setFilterStatus] = useState<"all" | "complete" | "incomplete" | "pending">("all");
    const [filterMesorregiao, setFilterMesorregiao] = useState<string>("all");
    const [registeringIds, setRegisteringIds] = useState<Set<string>>(new Set());
    const [isCSVModalOpen, setIsCSVModalOpen] = useState(false);
    const [isVereadoresModalOpen, setIsVereadoresModalOpen] = useState(false);
    const [isParanaModalOpen, setIsParanaModalOpen] = useState(false);
    const [isEleitoresModalOpen, setIsEleitoresModalOpen] = useState(false);

    // Set de IDs de cidades existentes no banco
    const existingCityIds = useMemo(() => {
        return new Set(dbCities.map(c => String(c.id)));
    }, [dbCities]);

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

    // Função para verificar se cidade tem dados completos
    const isCityComplete = (city: Cidade): boolean => {
        return !!(city.prefeito && city.partido);
    };

    // Função para obter o status da cidade
    const getCityStatus = (id: string | number): "complete" | "incomplete" | "pending" => {
        const city = dbCities.find(c => String(c.id) === String(id));
        if (!city) return "pending";
        return isCityComplete(city) ? "complete" : "incomplete";
    };

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

    // Função para importar dados do CSV
    const handleCSVImport = async (cities: Partial<Cidade>[]) => {
        await bulkUpsertCities(cities);
        // Recarrega os dados
        const registered = await fetchAllCities();
        setDbCities(registered);
    };

    // Função para importar vereadores do CSV
    const handleVereadoresImport = async (vereadores: Omit<Vereador, 'id' | 'created_at'>[]) => {
        await bulkInsertVereadores(vereadores);
    };

    // Função para importar CSV completo do Paraná (cidades + vereadores)
    const handleParanaImport = async (
        cities: Partial<Cidade>[],
        vereadores: Omit<Vereador, 'id' | 'created_at'>[]
    ) => {
        // Primeiro atualiza as cidades (usando UPDATE, não UPSERT)
        await bulkUpdateCities(cities);

        // Deleta vereadores existentes para evitar duplicatas
        const confirmDelete = window.confirm(
            `Foram encontrados ${vereadores.length} vereadores para importar.\n\nDeseja DELETAR todos os vereadores existentes antes de importar os novos?\n\n(Recomendado para evitar duplicatas)`
        );

        if (confirmDelete) {
            await deleteAllVereadores();
        }

        // Insere os novos vereadores
        await bulkInsertVereadores(vereadores);

        // Recarrega os dados
        const registered = await fetchAllCities();
        setDbCities(registered);

        alert(`✅ Importação concluída!\n\n• ${cities.length} cidades atualizadas\n• ${vereadores.length} vereadores importados`);
    };

    // Função para importar total de eleitores
    const handleEleitoresImport = async (cities: Partial<Cidade>[]) => {
        await bulkUpdateCities(cities);

        // Recarrega os dados
        const registered = await fetchAllCities();
        setDbCities(registered);

        alert(`✅ Total de eleitores atualizado para ${cities.length} cidades!`);
    };

    // Função para importar TODAS as cidades do GeoJSON de uma vez
    const [importingAll, setImportingAll] = useState(false);

    const handleImportAllCities = async () => {
        if (importingAll) return;

        const pendingCities = geoCities.filter(f => {
            const id = f.id || f.properties.id;
            return !existingCityIds.has(String(id));
        });

        if (pendingCities.length === 0) {
            alert("Todas as cidades já estão cadastradas!");
            return;
        }

        const confirm = window.confirm(
            `Deseja importar ${pendingCities.length} cidades pendentes?\n\nIsso vai cadastrar todas as cidades que ainda não estão no banco de dados.`
        );

        if (!confirm) return;

        setImportingAll(true);

        try {
            const citiesToImport: Partial<Cidade>[] = pendingCities.map(f => ({
                id: String(f.id || f.properties.id),
                name: f.properties.name,
                mesorregiao: f.properties.mesorregiao || undefined,
            }));

            await bulkUpsertCities(citiesToImport);

            // Recarrega os dados
            const registered = await fetchAllCities();
            setDbCities(registered);

            alert(`✅ ${citiesToImport.length} cidades importadas com sucesso!`);
        } catch (error) {
            console.error("Erro ao importar cidades:", error);
            alert("Erro ao importar cidades. Verifique o console.");
        } finally {
            setImportingAll(false);
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
        let complete = 0;
        let incomplete = 0;
        let pending = 0;

        geoCities.forEach(f => {
            const id = f.id || f.properties.id;
            const status = getCityStatus(id as string);
            if (status === "complete") complete++;
            else if (status === "incomplete") incomplete++;
            else pending++;
        });

        const registered = complete + incomplete;
        const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;
        return { total, complete, incomplete, pending, registered, percentage };
    }, [geoCities, dbCities]);

    // Filtragem
    const filteredCities = useMemo(() => {
        return geoCities.filter(feature => {
            const id = feature.id || feature.properties.id;
            const name = feature.properties.name.toLowerCase();
            const status = getCityStatus(id as string);

            // Filtro de busca
            if (searchTerm && !name.includes(searchTerm.toLowerCase())) {
                return false;
            }

            // Filtro de status
            if (filterStatus !== "all" && status !== filterStatus) return false;

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
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                <p className="mt-3 text-slate-500 text-sm">Carregando painel...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-6 font-sans">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Painel Administrativo</h1>
                        <p className="text-slate-500 text-sm mt-1">Gerencie os dados das cidades</p>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Botão para importar TODAS as cidades pendentes */}
                        {stats.pending > 0 && (
                            <button
                                onClick={handleImportAllCities}
                                disabled={importingAll}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                                {importingAll ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Importando...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Importar Todas ({stats.pending})
                                    </>
                                )}
                            </button>
                        )}
                        <button
                            onClick={() => setIsParanaModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            CSV Paraná
                        </button>
                        <button
                            onClick={() => setIsEleitoresModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Eleitores
                        </button>
                        <button
                            onClick={() => setIsCSVModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            CSV Cidades
                        </button>
                        <button
                            onClick={() => setIsVereadoresModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors text-sm"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            CSV Vereadores
                        </button>
                        <Link
                            href="/app/mapa"
                            className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            ← Voltar ao Mapa
                        </Link>
                    </div>
                </div>

                {/* Cards de Estatísticas */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase">Total</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{stats.total}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase">Completas</p>
                        <p className="text-2xl font-bold text-green-600 mt-1">{stats.complete}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase">Incompletas</p>
                        <p className="text-2xl font-bold text-orange-600 mt-1">{stats.incomplete}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase">Pendentes</p>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs font-medium text-slate-500 uppercase">Progresso</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{stats.percentage}%</p>
                        <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5">
                            <div className="bg-slate-600 h-1.5 rounded-full" style={{ width: `${stats.percentage}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Busca */}
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Buscar cidade..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-400 focus:border-slate-400 outline-none text-sm"
                            />
                        </div>

                        {/* Filtro de Status */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">Status:</span>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as "all" | "complete" | "incomplete" | "pending")}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                            >
                                <option value="all">Todas</option>
                                <option value="complete">Completas</option>
                                <option value="incomplete">Incompletas</option>
                                <option value="pending">Pendentes</option>
                            </select>
                        </div>

                        {/* Filtro de Mesorregião */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">Mesorregião:</span>
                            <select
                                value={filterMesorregiao}
                                onChange={(e) => setFilterMesorregiao(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                            >
                                <option value="all">Todas</option>
                                {mesorregioes.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                        {filteredCities.length} de {stats.total} cidades
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
                                    const status = getCityStatus(id as string);

                                    return (
                                        <tr
                                            key={id}
                                            className={`hover:bg-slate-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2 h-2 rounded-full ${status === 'complete' ? 'bg-emerald-500' :
                                                        status === 'incomplete' ? 'bg-orange-500' : 'bg-slate-300'
                                                        }`}></div>
                                                    <span className="text-sm font-medium text-slate-900">{name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-slate-600">{feature.properties.mesorregiao || "—"}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {status === "complete" ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        Completo
                                                    </span>
                                                ) : status === "incomplete" ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        Incompleto
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
                                                    {status === "pending" && (
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
                                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${status !== "pending"
                                                            ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                        {status !== "pending" ? 'Editar' : 'Detalhes'}
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

            {/* Modal de Upload CSV */}
            <CSVUploadModal
                isOpen={isCSVModalOpen}
                onClose={() => setIsCSVModalOpen(false)}
                onImport={handleCSVImport}
                existingCityIds={existingCityIds}
            />

            {/* Modal de Upload Vereadores */}
            <CSVVereadoresModal
                isOpen={isVereadoresModalOpen}
                onClose={() => setIsVereadoresModalOpen(false)}
                onImport={handleVereadoresImport}
            />

            {/* Modal de Import CSV Paraná Completo */}
            <CSVParanaImportModal
                isOpen={isParanaModalOpen}
                onClose={() => setIsParanaModalOpen(false)}
                onImport={handleParanaImport}
                existingCities={dbCities.map(c => ({ id: String(c.id), name: c.name }))}
            />

            {/* Modal de Import Total de Eleitores */}
            <CSVEleitoresImportModal
                isOpen={isEleitoresModalOpen}
                onClose={() => setIsEleitoresModalOpen(false)}
                onImport={handleEleitoresImport}
                existingCities={dbCities.map(c => ({ id: String(c.id), name: c.name, prefeito: c.prefeito }))}
            />
        </div>
    );
}
