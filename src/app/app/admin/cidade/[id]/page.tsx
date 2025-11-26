"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CidadeCompleta } from "@/types/types";
import {
    fetchCityData,
    upsertCityData,
    addVereador,
    deleteVereador,
    addCooperativa,
    deleteCooperativa,
    addEmpresario,
    deleteEmpresario
} from "@/utils/supabase/city";

export default function AdminCidadePage() {
    const params = useParams();
    const { id } = params;
    const [cidade, setCidade] = useState<CidadeCompleta | null>(null);
    const [loading, setLoading] = useState(true);

    // Estado para formulário de edição (dados da cidade)
    const [formData, setFormData] = useState<Partial<CidadeCompleta>>({});

    // Estados para inputs de novos itens
    const [newVereador, setNewVereador] = useState({ nome: "", partido: "" });
    const [newCooperativa, setNewCooperativa] = useState({ nome: "" });
    const [newEmpresario, setNewEmpresario] = useState({ nome: "" });

    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const cityId = decodeURIComponent(id as string);

            // 1. Buscar dados básicos do GeoJSON (para garantir nome/mesorregião se não estiver no DB)
            const res = await fetch("/data/municipios.json");
            const data = await res.json();
            const feature = data.features.find((f: { id?: string | number; properties: { id?: string | number; name?: string;[key: string]: unknown } }) =>
                f.id === id ||
                f.properties.id === id ||
                f.properties.name === cityId ||
                String(f.properties.id) === String(id)
            );

            // 2. Buscar dados do Supabase
            const dbData = await fetchCityData(cityId);

            if (feature || dbData) {
                const baseData = feature ? {
                    id: cityId,
                    name: feature.properties.name,
                    mesorregiao: feature.properties.mesorregiao,
                    ...feature.properties // outros dados do geojson
                } : {};

                // Merge: DB data tem prioridade
                const finalData: CidadeCompleta = {
                    ...baseData,
                    ...(dbData || {
                        id: cityId,
                        name: baseData.name || cityId,
                        vereadores: [],
                        cooperativas: [],
                        empresarios: []
                    })
                };

                // Se dbData existe, usa seus arrays. Se não, usa vazios
                if (dbData) {
                    finalData.vereadores = dbData.vereadores;
                    finalData.cooperativas = dbData.cooperativas;
                    finalData.empresarios = dbData.empresarios;
                } else {
                    finalData.vereadores = [];
                    finalData.cooperativas = [];
                    finalData.empresarios = [];
                }

                setCidade(finalData);
                setFormData(finalData);
            }
        } catch (err) {
            console.error("Erro ao carregar dados:", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSaveCity = async () => {
        if (!cidade) return;
        try {
            const cityUpdate = {
                id: cidade.id, // Importante para o upsert
                name: formData.name,
                mesorregiao: formData.mesorregiao,
                eleitores: Number(formData.eleitores),
                prefeito: formData.prefeito,
                partido: formData.partido,
                status_prefeito: formData.status_prefeito,
                total_votos: Number(formData.total_votos),
                vice_prefeito: formData.vice_prefeito,
                partido_vice: formData.partido_vice,
                status_vice: formData.status_vice,
                apoio: Number(formData.apoio),
                nao_apoio: Number(formData.nao_apoio),
            };

            await upsertCityData(cityUpdate);
            loadData();
            alert("Dados da cidade salvos com sucesso!");
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar dados.");
        }
    };

    // --- Handlers para Vereadores ---
    const handleAddVereador = async () => {
        if (!cidade || !newVereador.nome) return;
        try {
            await addVereador({
                cidade_id: cidade.id,
                nome: newVereador.nome,
                partido: newVereador.partido
            });
            setNewVereador({ nome: "", partido: "" });
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar vereador");
        }
    };

    const handleDeleteVereador = async (id: string) => {
        if (!confirm("Tem certeza?")) return;
        try {
            await deleteVereador(id);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    // --- Handlers para Cooperativas ---
    const handleAddCooperativa = async () => {
        if (!cidade || !newCooperativa.nome) return;
        try {
            await addCooperativa({
                cidade_id: cidade.id,
                nome: newCooperativa.nome
            });
            setNewCooperativa({ nome: "" });
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar cooperativa");
        }
    };

    const handleDeleteCooperativa = async (id: string) => {
        if (!confirm("Tem certeza?")) return;
        try {
            await deleteCooperativa(id);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    // --- Handlers para Empresários ---
    const handleAddEmpresario = async () => {
        if (!cidade || !newEmpresario.nome) return;
        try {
            await addEmpresario({
                cidade_id: cidade.id,
                nome: newEmpresario.nome
            });
            setNewEmpresario({ nome: "" });
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar empresário");
        }
    };

    const handleDeleteEmpresario = async (id: string) => {
        if (!confirm("Tem certeza?")) return;
        try {
            await deleteEmpresario(id);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-slate-600 font-medium">Carregando dados da cidade...</p>
        </div>
    );

    if (!cidade) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-slate-600 font-medium">Cidade não encontrada.</p>
            <Link href="/app/admin" className="mt-4 text-emerald-600 hover:text-emerald-700 font-medium">
                Voltar ao painel
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 p-6 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-100 p-2 rounded-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">{cidade.name}</h1>
                                <p className="text-slate-500 text-sm">{cidade.mesorregiao}</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={`/app/cidade/${encodeURIComponent(cidade.id)}`}
                            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2.5 rounded-lg font-medium transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Ver Página Pública
                        </Link>
                        <Link
                            href="/app/admin"
                            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-lg border border-slate-200 shadow-sm font-medium transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Voltar
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dados Gerais */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <h2 className="text-lg font-bold text-slate-800">Dados Gerais</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Prefeito</label>
                                <input name="prefeito" value={formData.prefeito || ""} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Partido</label>
                                <input name="partido" value={formData.partido || ""} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Status Prefeito</label>
                                <input name="status_prefeito" value={formData.status_prefeito || ""} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Total Votos</label>
                                <input type="number" name="total_votos" value={formData.total_votos || 0} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Vice-Prefeito</label>
                                <input name="vice_prefeito" value={formData.vice_prefeito || ""} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Partido Vice</label>
                                <input name="partido_vice" value={formData.partido_vice || ""} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Status Vice</label>
                                <input name="status_vice" value={formData.status_vice || ""} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Eleitores</label>
                                <input type="number" name="eleitores" value={formData.eleitores || 0} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Apoio (Votos)</label>
                                <input type="number" name="apoio" value={formData.apoio || 0} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Não Apoio (Votos)</label>
                                <input type="number" name="nao_apoio" value={formData.nao_apoio || 0} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                            </div>
                        </div>
                        <button onClick={handleSaveCity} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 font-medium transition-all flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Salvar Dados Gerais
                        </button>
                    </div>

                    {/* Vereadores */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <h2 className="text-lg font-bold text-slate-800">Vereadores</h2>
                            <span className="ml-auto bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-1 rounded-full">{cidade.vereadores?.length || 0}</span>
                        </div>
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {cidade.vereadores?.length === 0 && (
                                <li className="text-center text-slate-400 py-4">Nenhum vereador cadastrado</li>
                            )}
                            {cidade.vereadores?.map((ver) => (
                                <li key={ver.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <div>
                                        <span className="text-slate-800 font-medium">{ver.nome}</span>
                                        <span className="ml-2 text-slate-500 text-sm">({ver.partido})</span>
                                    </div>
                                    <button onClick={() => handleDeleteVereador(ver.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 border-t border-slate-100 pt-4">
                            <input placeholder="Nome" value={newVereador.nome} onChange={(e) => setNewVereador({ ...newVereador, nome: e.target.value })} className="flex-1 border border-slate-200 p-2.5 rounded-lg text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none" />
                            <input placeholder="Partido" value={newVereador.partido} onChange={(e) => setNewVereador({ ...newVereador, partido: e.target.value })} className="w-24 border border-slate-200 p-2.5 rounded-lg text-slate-800 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none" />
                            <button onClick={handleAddVereador} className="bg-cyan-600 text-white px-4 rounded-lg hover:bg-cyan-700 font-medium transition-all">Add</button>
                        </div>
                    </div>

                    {/* Cooperativas */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <h2 className="text-lg font-bold text-slate-800">Cooperativas</h2>
                            <span className="ml-auto bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-1 rounded-full">{cidade.cooperativas?.length || 0}</span>
                        </div>
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {cidade.cooperativas?.length === 0 && (
                                <li className="text-center text-slate-400 py-4">Nenhuma cooperativa cadastrada</li>
                            )}
                            {cidade.cooperativas?.map((coop) => (
                                <li key={coop.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <span className="text-slate-800 font-medium">{coop.nome}</span>
                                    <button onClick={() => handleDeleteCooperativa(coop.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 border-t border-slate-100 pt-4">
                            <input placeholder="Nome da Cooperativa" value={newCooperativa.nome} onChange={(e) => setNewCooperativa({ ...newCooperativa, nome: e.target.value })} className="flex-1 border border-slate-200 p-2.5 rounded-lg text-slate-800 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none" />
                            <button onClick={handleAddCooperativa} className="bg-amber-600 text-white px-4 rounded-lg hover:bg-amber-700 font-medium transition-all">Add</button>
                        </div>
                    </div>

                    {/* Empresários */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <h2 className="text-lg font-bold text-slate-800">Empresários</h2>
                            <span className="ml-auto bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-1 rounded-full">{cidade.empresarios?.length || 0}</span>
                        </div>
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {cidade.empresarios?.length === 0 && (
                                <li className="text-center text-slate-400 py-4">Nenhum empresário cadastrado</li>
                            )}
                            {cidade.empresarios?.map((emp) => (
                                <li key={emp.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <span className="text-slate-800 font-medium">{emp.nome}</span>
                                    <button onClick={() => handleDeleteEmpresario(emp.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 border-t border-slate-100 pt-4">
                            <input placeholder="Nome do Empresário" value={newEmpresario.nome} onChange={(e) => setNewEmpresario({ ...newEmpresario, nome: e.target.value })} className="flex-1 border border-slate-200 p-2.5 rounded-lg text-slate-800 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none" />
                            <button onClick={handleAddEmpresario} className="bg-violet-600 text-white px-4 rounded-lg hover:bg-violet-700 font-medium transition-all">Add</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
