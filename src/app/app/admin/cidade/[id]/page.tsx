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
    deleteEmpresario,
    addImprensa,
    deleteImprensa
} from "@/utils/supabase/city";

export default function AdminCidadePage() {
    const params = useParams();
    const { id } = params;
    const [cidade, setCidade] = useState<CidadeCompleta | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Estado para formulário de edição (dados da cidade)
    const [formData, setFormData] = useState({
        prefeito: "",
        partido: "",
        status_prefeito: "",
        total_votos: "",
        vice_prefeito: "",
        partido_vice: "",
        status_vice: "",
        eleitores: "",
        apoio: "",
        nao_apoio: "",
    });

    // Estados para inputs de novos itens
    const [newVereador, setNewVereador] = useState({ nome: "", partido: "" });
    const [newCooperativa, setNewCooperativa] = useState({ nome: "" });
    const [newEmpresario, setNewEmpresario] = useState({ nome: "" });
    const [newImprensa, setNewImprensa] = useState({ nome: "", tipo: "" });

    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const cityId = decodeURIComponent(id as string);

            // 1. Buscar dados básicos do GeoJSON
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
                } : {};

                const finalData: CidadeCompleta = {
                    ...baseData,
                    ...(dbData || {
                        id: cityId,
                        name: baseData.name || cityId,
                        vereadores: [],
                        cooperativas: [],
                        empresarios: [],
                        imprensa: []
                    })
                };

                if (dbData) {
                    finalData.vereadores = dbData.vereadores;
                    finalData.cooperativas = dbData.cooperativas;
                    finalData.empresarios = dbData.empresarios;
                    finalData.imprensa = dbData.imprensa;
                } else {
                    finalData.vereadores = [];
                    finalData.cooperativas = [];
                    finalData.empresarios = [];
                    finalData.imprensa = [];
                }

                setCidade(finalData);

                // Preenche o formData com strings (para evitar problemas com controlled inputs)
                setFormData({
                    prefeito: finalData.prefeito || "",
                    partido: finalData.partido || "",
                    status_prefeito: finalData.status_prefeito || "",
                    total_votos: finalData.total_votos?.toString() || "",
                    vice_prefeito: finalData.vice_prefeito || "",
                    partido_vice: finalData.partido_vice || "",
                    status_vice: finalData.status_vice || "",
                    eleitores: finalData.eleitores?.toString() || "",
                    apoio: finalData.apoio?.toString() || "",
                    nao_apoio: finalData.nao_apoio?.toString() || "",
                });
                setHasChanges(false);
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setHasChanges(true);
    };

    const handleSaveCity = async () => {
        if (!cidade) return;
        setSaving(true);
        try {
            // Converte strings para números apenas se tiver valor
            const cityUpdate = {
                id: cidade.id,
                name: cidade.name,
                mesorregiao: cidade.mesorregiao,
                prefeito: formData.prefeito || undefined,
                partido: formData.partido || undefined,
                status_prefeito: formData.status_prefeito || undefined,
                vice_prefeito: formData.vice_prefeito || undefined,
                partido_vice: formData.partido_vice || undefined,
                status_vice: formData.status_vice || undefined,
                total_votos: formData.total_votos ? parseInt(formData.total_votos) : undefined,
                eleitores: formData.eleitores ? parseInt(formData.eleitores) : undefined,
                apoio: formData.apoio ? parseInt(formData.apoio) : undefined,
                nao_apoio: formData.nao_apoio ? parseInt(formData.nao_apoio) : undefined,
            };

            await upsertCityData(cityUpdate);
            setHasChanges(false);
            setSaveSuccess(true);

            // Reseta o feedback após 2 segundos
            setTimeout(() => {
                setSaveSuccess(false);
            }, 2000);
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar dados. Verifique o console para mais detalhes.");
        } finally {
            setSaving(false);
        }
    };

    // --- Handlers para Vereadores ---
    const handleAddVereador = async () => {
        if (!cidade || !newVereador.nome.trim()) return;
        try {
            await addVereador({
                cidade_id: cidade.id,
                nome: newVereador.nome.trim(),
                partido: newVereador.partido.trim() || undefined
            });
            setNewVereador({ nome: "", partido: "" });
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar vereador");
        }
    };

    const handleDeleteVereador = async (vereadorId: string) => {
        if (!confirm("Tem certeza que deseja remover este vereador?")) return;
        try {
            await deleteVereador(vereadorId);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    // --- Handlers para Cooperativas ---
    const handleAddCooperativa = async () => {
        if (!cidade || !newCooperativa.nome.trim()) return;
        try {
            await addCooperativa({
                cidade_id: cidade.id,
                nome: newCooperativa.nome.trim()
            });
            setNewCooperativa({ nome: "" });
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar cooperativa");
        }
    };

    const handleDeleteCooperativa = async (coopId: string) => {
        if (!confirm("Tem certeza que deseja remover esta cooperativa?")) return;
        try {
            await deleteCooperativa(coopId);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    // --- Handlers para Empresários ---
    const handleAddEmpresario = async () => {
        if (!cidade || !newEmpresario.nome.trim()) return;
        try {
            await addEmpresario({
                cidade_id: cidade.id,
                nome: newEmpresario.nome.trim()
            });
            setNewEmpresario({ nome: "" });
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar empresário");
        }
    };

    const handleDeleteEmpresario = async (empId: string) => {
        if (!confirm("Tem certeza que deseja remover este empresário?")) return;
        try {
            await deleteEmpresario(empId);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    // --- Handlers para Imprensa ---
    const handleAddImprensa = async () => {
        if (!cidade || !newImprensa.nome.trim()) return;
        try {
            await addImprensa({
                cidade_id: cidade.id,
                nome: newImprensa.nome.trim(),
                tipo: newImprensa.tipo.trim() || undefined
            });
            setNewImprensa({ nome: "", tipo: "" });
            loadData();
        } catch (error) {
            console.error(error);
            alert("Erro ao adicionar imprensa");
        }
    };

    const handleDeleteImprensa = async (imprensaId: string) => {
        if (!confirm("Tem certeza que deseja remover este veículo de imprensa?")) return;
        try {
            await deleteImprensa(imprensaId);
            loadData();
        } catch (error) {
            console.error(error);
        }
    };

    // Status options
    const statusOptions = [
        { value: "", label: "Selecione..." },
        { value: "aliado", label: "Aliado" },
        { value: "neutro", label: "Neutro" },
        { value: "oposição", label: "Oposição" },
    ];

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
        <div className="min-h-screen bg-slate-100 p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">{cidade.name}</h1>
                            <p className="text-slate-500 text-sm mt-1">{cidade.mesorregiao}</p>
                        </div>
                        <div className="flex gap-3 text-sm">
                            <Link
                                href={`/cidade/${encodeURIComponent(cidade.id)}`}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Ver página pública →
                            </Link>
                            <span className="text-slate-300">|</span>
                            <Link
                                href="/app/admin"
                                className="text-slate-500 hover:text-slate-700"
                            >
                                ← Voltar
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Formulário Principal */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 mb-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-slate-800">Informações Políticas</h2>
                        {hasChanges && (
                            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                                Alterações não salvas
                            </span>
                        )}
                    </div>

                    {/* Prefeito */}
                    <div className="mb-8">
                        <h3 className="text-sm font-medium text-slate-600 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            Prefeito
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Nome do Prefeito</label>
                                <input
                                    name="prefeito"
                                    value={formData.prefeito}
                                    onChange={handleInputChange}
                                    placeholder="Ex: João Silva"
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Partido</label>
                                <input
                                    name="partido"
                                    value={formData.partido}
                                    onChange={handleInputChange}
                                    placeholder="Ex: PL, PT, MDB..."
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                                <select
                                    name="status_prefeito"
                                    value={formData.status_prefeito}
                                    onChange={handleInputChange}
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Vice-Prefeito */}
                    <div className="mb-8">
                        <h3 className="text-sm font-medium text-slate-600 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Vice-Prefeito
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Nome do Vice</label>
                                <input
                                    name="vice_prefeito"
                                    value={formData.vice_prefeito}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Maria Santos"
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Partido</label>
                                <input
                                    name="partido_vice"
                                    value={formData.partido_vice}
                                    onChange={handleInputChange}
                                    placeholder="Ex: PP, PSDB..."
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Status</label>
                                <select
                                    name="status_vice"
                                    value={formData.status_vice}
                                    onChange={handleInputChange}
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                                >
                                    {statusOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Dados Eleitorais */}
                    <div className="mb-8">
                        <h3 className="text-sm font-medium text-slate-600 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                            Dados Eleitorais
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Total de Eleitores</label>
                                <input
                                    type="number"
                                    name="eleitores"
                                    value={formData.eleitores}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Total de Votos</label>
                                <input
                                    type="number"
                                    name="total_votos"
                                    value={formData.total_votos}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Votos de Apoio</label>
                                <input
                                    type="number"
                                    name="apoio"
                                    value={formData.apoio}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Votos Não Apoio</label>
                                <input
                                    type="number"
                                    name="nao_apoio"
                                    value={formData.nao_apoio}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    className="w-full border border-slate-200 rounded-lg p-2.5 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botão Salvar */}
                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button
                            onClick={handleSaveCity}
                            disabled={saving}
                            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${saving
                                ? "bg-slate-400 text-white cursor-not-allowed"
                                : saveSuccess
                                    ? "bg-green-600 text-white"
                                    : hasChanges
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-slate-800 text-white hover:bg-slate-700"
                                }`}
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Salvando...
                                </>
                            ) : saveSuccess ? (
                                "✓ Salvo!"
                            ) : (
                                "Salvar Alterações"
                            )}
                        </button>
                    </div>
                </div>

                {/* Grid de Listas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Vereadores */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-700">Vereadores</h2>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {cidade.vereadores?.length || 0}
                            </span>
                        </div>

                        <ul className="space-y-2 max-h-64 overflow-y-auto mb-4">
                            {cidade.vereadores?.length === 0 && (
                                <li className="text-center text-slate-400 py-6 text-sm">
                                    Nenhum vereador cadastrado
                                </li>
                            )}
                            {cidade.vereadores?.map((ver) => (
                                <li key={ver.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg group hover:bg-slate-100 transition-colors">
                                    <div>
                                        <span className="text-slate-800 text-sm font-medium">{ver.nome}</span>
                                        {ver.partido && (
                                            <span className="ml-2 text-slate-500 text-xs">({ver.partido})</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleDeleteVereador(ver.id)}
                                        className="text-red-500 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Remover
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="border-t border-slate-100 pt-4">
                            <div className="flex gap-2">
                                <input
                                    placeholder="Nome"
                                    value={newVereador.nome}
                                    onChange={(e) => setNewVereador({ ...newVereador, nome: e.target.value })}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddVereador()}
                                    className="flex-1 border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                <input
                                    placeholder="Partido"
                                    value={newVereador.partido}
                                    onChange={(e) => setNewVereador({ ...newVereador, partido: e.target.value })}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddVereador()}
                                    className="w-20 border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                <button
                                    onClick={handleAddVereador}
                                    disabled={!newVereador.nome.trim()}
                                    className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Cooperativas */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-700">Cooperativas</h2>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {cidade.cooperativas?.length || 0}
                            </span>
                        </div>

                        <ul className="space-y-2 max-h-64 overflow-y-auto mb-4">
                            {cidade.cooperativas?.length === 0 && (
                                <li className="text-center text-slate-400 py-6 text-sm">
                                    Nenhuma cooperativa cadastrada
                                </li>
                            )}
                            {cidade.cooperativas?.map((coop) => (
                                <li key={coop.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg group hover:bg-slate-100 transition-colors">
                                    <span className="text-slate-800 text-sm font-medium">{coop.nome}</span>
                                    <button
                                        onClick={() => handleDeleteCooperativa(coop.id)}
                                        className="text-red-500 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Remover
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="border-t border-slate-100 pt-4">
                            <div className="flex gap-2">
                                <input
                                    placeholder="Nome da Cooperativa"
                                    value={newCooperativa.nome}
                                    onChange={(e) => setNewCooperativa({ nome: e.target.value })}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddCooperativa()}
                                    className="flex-1 border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                <button
                                    onClick={handleAddCooperativa}
                                    disabled={!newCooperativa.nome.trim()}
                                    className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Empresários */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-semibold text-slate-700">Empresários</h2>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                                {cidade.empresarios?.length || 0}
                            </span>
                        </div>

                        <ul className="space-y-2 max-h-64 overflow-y-auto mb-4">
                            {cidade.empresarios?.length === 0 && (
                                <li className="text-center text-slate-400 py-6 text-sm">
                                    Nenhum empresário cadastrado
                                </li>
                            )}
                            {cidade.empresarios?.map((emp) => (
                                <li key={emp.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg group hover:bg-slate-100 transition-colors">
                                    <span className="text-slate-800 text-sm font-medium">{emp.nome}</span>
                                    <button
                                        onClick={() => handleDeleteEmpresario(emp.id)}
                                        className="text-red-500 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        Remover
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="border-t border-slate-100 pt-4">
                            <div className="flex gap-2">
                                <input
                                    placeholder="Nome do Empresário"
                                    value={newEmpresario.nome}
                                    onChange={(e) => setNewEmpresario({ nome: e.target.value })}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddEmpresario()}
                                    className="flex-1 border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                />
                                <button
                                    onClick={handleAddEmpresario}
                                    disabled={!newEmpresario.nome.trim()}
                                    className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Imprensa - Seção em largura total */}
                <div className="mt-6 bg-white rounded-xl border border-slate-200 p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            <h2 className="text-lg font-semibold text-slate-700">Imprensa Local</h2>
                        </div>
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                            {cidade.imprensa?.length || 0} veículo(s)
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                        {cidade.imprensa?.length === 0 && (
                            <div className="col-span-full text-center text-slate-400 py-8 text-sm">
                                Nenhum veículo de imprensa cadastrado
                            </div>
                        )}
                        {cidade.imprensa?.map((imp) => (
                            <div key={imp.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg group hover:bg-slate-100 transition-colors">
                                <div>
                                    <span className="text-slate-800 text-sm font-medium">{imp.nome}</span>
                                    {imp.tipo && (
                                        <span className="ml-2 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                            {imp.tipo}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleDeleteImprensa(imp.id)}
                                    className="text-red-500 hover:text-red-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Remover
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <div className="flex gap-2">
                            <input
                                placeholder="Nome do veículo (ex: Rádio Cidade FM)"
                                value={newImprensa.nome}
                                onChange={(e) => setNewImprensa({ ...newImprensa, nome: e.target.value })}
                                onKeyDown={(e) => e.key === "Enter" && handleAddImprensa()}
                                className="flex-1 border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                            <select
                                value={newImprensa.tipo}
                                onChange={(e) => setNewImprensa({ ...newImprensa, tipo: e.target.value })}
                                className="w-32 border border-slate-200 p-2 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                            >
                                <option value="">Tipo...</option>
                                <option value="Rádio">Rádio</option>
                                <option value="TV">TV</option>
                                <option value="Jornal">Jornal</option>
                                <option value="Portal">Portal</option>
                                <option value="Revista">Revista</option>
                                <option value="Podcast">Podcast</option>
                                <option value="Outro">Outro</option>
                            </select>
                            <button
                                onClick={handleAddImprensa}
                                disabled={!newImprensa.nome.trim()}
                                className="bg-slate-800 text-white px-4 rounded-lg hover:bg-slate-700 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                + Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
