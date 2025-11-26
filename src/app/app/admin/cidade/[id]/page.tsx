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
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            <p className="mt-3 text-slate-500 text-sm">Carregando...</p>
        </div>
    );

    if (!cidade) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-slate-500">Cidade não encontrada.</p>
            <Link href="/app/admin" className="mt-4 text-slate-600 hover:text-slate-800 text-sm">
                ← Voltar ao painel
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{cidade.name}</h1>
                        <p className="text-slate-500 text-sm mt-1">{cidade.mesorregiao}</p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href={`/app/cidade/${encodeURIComponent(cidade.id)}`}
                            className="text-sm text-slate-500 hover:text-slate-700"
                        >
                            Ver página pública
                        </Link>
                        <span className="text-slate-300">|</span>
                        <Link
                            href="/app/admin"
                            className="text-sm text-slate-500 hover:text-slate-700"
                        >
                            ← Voltar
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Dados Gerais */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                        <h2 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-3">Dados Gerais</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Prefeito</label>
                                <input name="prefeito" value={formData.prefeito || ""} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Partido</label>
                                <input name="partido" value={formData.partido || ""} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Status Prefeito</label>
                                <input name="status_prefeito" value={formData.status_prefeito || ""} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Total Votos</label>
                                <input type="number" name="total_votos" value={formData.total_votos || 0} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Vice-Prefeito</label>
                                <input name="vice_prefeito" value={formData.vice_prefeito || ""} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Partido Vice</label>
                                <input name="partido_vice" value={formData.partido_vice || ""} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Status Vice</label>
                                <input name="status_vice" value={formData.status_vice || ""} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Eleitores</label>
                                <input type="number" name="eleitores" value={formData.eleitores || 0} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Apoio (Votos)</label>
                                <input type="number" name="apoio" value={formData.apoio || 0} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Não Apoio (Votos)</label>
                                <input type="number" name="nao_apoio" value={formData.nao_apoio || 0} onChange={handleInputChange} className="w-full border border-slate-200 rounded-lg p-2 text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none transition-all" />
                            </div>
                        </div>
                        <button onClick={handleSaveCity} className="w-full bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-700 text-sm font-medium transition-all">
                            Salvar Alterações
                        </button>
                    </div>

                    {/* Vereadores */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-sm font-semibold text-slate-700">Vereadores</h2>
                            <span className="text-xs text-slate-500">{cidade.vereadores?.length || 0}</span>
                        </div>
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {cidade.vereadores?.length === 0 && (
                                <li className="text-center text-slate-400 py-4 text-sm">Nenhum vereador cadastrado</li>
                            )}
                            {cidade.vereadores?.map((ver) => (
                                <li key={ver.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <div>
                                        <span className="text-slate-800 text-sm">{ver.nome}</span>
                                        <span className="ml-2 text-slate-500 text-xs">({ver.partido})</span>
                                    </div>
                                    <button onClick={() => handleDeleteVereador(ver.id)} className="text-red-500 hover:text-red-600 text-xs">
                                        Remover
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 border-t border-slate-100 pt-4">
                            <input placeholder="Nome" value={newVereador.nome} onChange={(e) => setNewVereador({ ...newVereador, nome: e.target.value })} className="flex-1 border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none" />
                            <input placeholder="Partido" value={newVereador.partido} onChange={(e) => setNewVereador({ ...newVereador, partido: e.target.value })} className="w-24 border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none" />
                            <button onClick={handleAddVereador} className="bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-700 text-sm transition-all">Add</button>
                        </div>
                    </div>

                    {/* Cooperativas */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-sm font-semibold text-slate-700">Cooperativas</h2>
                            <span className="text-xs text-slate-500">{cidade.cooperativas?.length || 0}</span>
                        </div>
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {cidade.cooperativas?.length === 0 && (
                                <li className="text-center text-slate-400 py-4 text-sm">Nenhuma cooperativa cadastrada</li>
                            )}
                            {cidade.cooperativas?.map((coop) => (
                                <li key={coop.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <span className="text-slate-800 text-sm">{coop.nome}</span>
                                    <button onClick={() => handleDeleteCooperativa(coop.id)} className="text-red-500 hover:text-red-600 text-xs">
                                        Remover
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 border-t border-slate-100 pt-4">
                            <input placeholder="Nome da Cooperativa" value={newCooperativa.nome} onChange={(e) => setNewCooperativa({ ...newCooperativa, nome: e.target.value })} className="flex-1 border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none" />
                            <button onClick={handleAddCooperativa} className="bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-700 text-sm transition-all">Add</button>
                        </div>
                    </div>

                    {/* Empresários */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h2 className="text-sm font-semibold text-slate-700">Empresários</h2>
                            <span className="text-xs text-slate-500">{cidade.empresarios?.length || 0}</span>
                        </div>
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {cidade.empresarios?.length === 0 && (
                                <li className="text-center text-slate-400 py-4 text-sm">Nenhum empresário cadastrado</li>
                            )}
                            {cidade.empresarios?.map((emp) => (
                                <li key={emp.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                                    <span className="text-slate-800 text-sm">{emp.nome}</span>
                                    <button onClick={() => handleDeleteEmpresario(emp.id)} className="text-red-500 hover:text-red-600 text-xs">
                                        Remover
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 border-t border-slate-100 pt-4">
                            <input placeholder="Nome do Empresário" value={newEmpresario.nome} onChange={(e) => setNewEmpresario({ ...newEmpresario, nome: e.target.value })} className="flex-1 border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-1 focus:ring-slate-400 focus:border-slate-400 outline-none" />
                            <button onClick={handleAddEmpresario} className="bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-700 text-sm transition-all">Add</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
