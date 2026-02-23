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
    updateCooperativa,
    addEmpresario,
    deleteEmpresario,
    updateEmpresario,
    addImprensa,
    deleteImprensa,
    updateImprensa
} from "@/utils/supabase/city";
import CooperativaModal from "../../components/CooperativaModal";
import EmpresarioModal from "../../components/EmpresarioModal";
import ImprensaModal from "../../components/ImprensaModal";
import { Cooperativa, Empresario, Imprensa } from "@/types/types";

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
        votos_validos: "",
        vice_prefeito: "",
        partido_vice: "",
        status_vice: "",
        eleitores: "",
        apoio: "",
        nao_apoio: "",
    });

    // Estados para inputs de novos itens
    const [newVereador, setNewVereador] = useState({ nome: "", partido: "" });

    // Estados para modais
    const [showCooperativaModal, setShowCooperativaModal] = useState(false);
    const [showEmpresarioModal, setShowEmpresarioModal] = useState(false);
    const [showImprensaModal, setShowImprensaModal] = useState(false);
    const [editingImprensa, setEditingImprensa] = useState<Imprensa | null>(null);
    const [editingEmpresario, setEditingEmpresario] = useState<Empresario | null>(null);
    const [editingCooperativa, setEditingCooperativa] = useState<Cooperativa | null>(null);
    const [cooperativaModalMode, setCooperativaModalMode] = useState<"create" | "edit" | "view">("create");
    const [imprensaModalMode, setImprensaModalMode] = useState<"create" | "edit" | "view">("create");

    const getErrorMessage = (error: unknown, fallback: string) => {
        if (typeof error === "object" && error !== null) {
            const maybeMessage = "message" in error ? String(error.message) : "";
            const maybeCode = "code" in error ? String(error.code) : "";

            if (maybeCode === "42501") {
                return "Sem permissão para gravar no Supabase (RLS). Ajuste as policies da tabela.";
            }

            if (maybeMessage) {
                return maybeMessage;
            }
        }

        return fallback;
    };

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
                    votos_validos: finalData.votos_validos?.toString() || "",
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
                votos_validos: formData.votos_validos ? parseInt(formData.votos_validos) : undefined,
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
    const handleAddCooperativa = async (data: {
        nome: string;
        responsavel: string;
        telefone: string;
        email: string;
        endereco: string;
        observacoes: string;
    }) => {
        if (!cidade) return;
        try {
            if (editingCooperativa) {
                await updateCooperativa(editingCooperativa.id, {
                    nome: data.nome.trim(),
                    responsavel: data.responsavel.trim() || undefined,
                    telefone: data.telefone.trim() || undefined,
                    email: data.email.trim() || undefined,
                    endereco: data.endereco.trim() || undefined,
                    observacoes: data.observacoes.trim() || undefined,
                });
                setEditingCooperativa(null);
            } else {
                await addCooperativa({
                    cidade_id: cidade.id,
                    nome: data.nome.trim(),
                    responsavel: data.responsavel.trim() || undefined,
                    telefone: data.telefone.trim() || undefined,
                    email: data.email.trim() || undefined,
                    endereco: data.endereco.trim() || undefined,
                    observacoes: data.observacoes.trim() || undefined,
                });
            }
            loadData();
        } catch (error) {
            console.error(error);
            alert(getErrorMessage(
                error,
                editingCooperativa ? "Erro ao atualizar cooperativa" : "Erro ao adicionar cooperativa"
            ));
        }
    };

    const handleViewCooperativa = (coop: Cooperativa) => {
        setEditingCooperativa(coop);
        setCooperativaModalMode("view");
        setShowCooperativaModal(true);
    };

    const handleEditCooperativa = (coop: Cooperativa) => {
        setEditingCooperativa(coop);
        setCooperativaModalMode("edit");
        setShowCooperativaModal(true);
    };

    const handleCloseCooperativaModal = () => {
        setShowCooperativaModal(false);
        setEditingCooperativa(null);
        setCooperativaModalMode("create");
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
    const handleAddEmpresario = async (data: {
        nome: string;
        responsavel: string;
        telefone: string;
        email: string;
        empresa: string;
        segmento: string;
        endereco: string;
        observacoes: string;
    }) => {
        if (!cidade) return;
        try {
            if (editingEmpresario) {
                await updateEmpresario(editingEmpresario.id, {
                    nome: data.nome.trim(),
                    responsavel: data.responsavel.trim() || undefined,
                    telefone: data.telefone.trim() || undefined,
                    email: data.email.trim() || undefined,
                    empresa: data.empresa.trim() || undefined,
                    segmento: data.segmento.trim() || undefined,
                    endereco: data.endereco.trim() || undefined,
                    observacoes: data.observacoes.trim() || undefined,
                });
                setEditingEmpresario(null);
            } else {
                await addEmpresario({
                    cidade_id: cidade.id,
                    nome: data.nome.trim(),
                    responsavel: data.responsavel.trim() || undefined,
                    telefone: data.telefone.trim() || undefined,
                    email: data.email.trim() || undefined,
                    empresa: data.empresa.trim() || undefined,
                    segmento: data.segmento.trim() || undefined,
                    endereco: data.endereco.trim() || undefined,
                    observacoes: data.observacoes.trim() || undefined,
                });
            }
            loadData();
        } catch (error) {
            console.error(error);
            alert(getErrorMessage(
                error,
                editingEmpresario ? "Erro ao atualizar empresário" : "Erro ao adicionar empresário"
            ));
        }
    };

    const handleEditEmpresario = (emp: Empresario) => {
        setEditingEmpresario(emp);
        setShowEmpresarioModal(true);
    };

    const handleCloseEmpresarioModal = () => {
        setShowEmpresarioModal(false);
        setEditingEmpresario(null);
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
    const handleAddImprensa = async (data: {
        nome: string;
        tipo: string;
        responsavel: string;
        telefone: string;
        email: string;
        endereco: string;
        website: string;
        observacoes: string;
    }) => {
        if (!cidade) return;
        try {
            if (editingImprensa) {
                // Modo edição
                await updateImprensa(editingImprensa.id, {
                    nome: data.nome.trim(),
                    tipo: data.tipo.trim() || undefined,
                    responsavel: data.responsavel.trim() || undefined,
                    telefone: data.telefone.trim() || undefined,
                    email: data.email.trim() || undefined,
                    endereco: data.endereco.trim() || undefined,
                    website: data.website.trim() || undefined,
                    observacoes: data.observacoes.trim() || undefined,
                });
                setEditingImprensa(null);
            } else {
                // Modo adição
                await addImprensa({
                    cidade_id: cidade.id,
                    nome: data.nome.trim(),
                    tipo: data.tipo.trim() || undefined,
                    responsavel: data.responsavel.trim() || undefined,
                    telefone: data.telefone.trim() || undefined,
                    email: data.email.trim() || undefined,
                    endereco: data.endereco.trim() || undefined,
                    website: data.website.trim() || undefined,
                    observacoes: data.observacoes.trim() || undefined,
                });
            }
            loadData();
        } catch (error) {
            console.error(error);
            alert(getErrorMessage(
                error,
                editingImprensa ? "Erro ao atualizar imprensa" : "Erro ao adicionar imprensa"
            ));
        }
    };

    const handleEditImprensa = (imprensa: Imprensa) => {
        setEditingImprensa(imprensa);
        setImprensaModalMode("edit");
        setShowImprensaModal(true);
    };

    const handleViewImprensa = (imprensa: Imprensa) => {
        setEditingImprensa(imprensa);
        setImprensaModalMode("view");
        setShowImprensaModal(true);
    };

    const handleCloseImprensaModal = () => {
        setShowImprensaModal(false);
        setEditingImprensa(null);
        setImprensaModalMode("create");
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
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                                <label className="block text-xs font-medium text-slate-500 mb-1.5">Votos Válidos</label>
                                <input
                                    type="number"
                                    name="votos_validos"
                                    value={formData.votos_validos}
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

                        <ul className="space-y-2 max-h-96 overflow-y-auto mb-4">
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
                                        className="text-red-500 hover:text-red-600 text-xs"
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

                        <ul className="space-y-2 max-h-96 overflow-y-auto mb-4">
                            {cidade.cooperativas?.length === 0 && (
                                <li className="text-center text-slate-400 py-6 text-sm">
                                    Nenhuma cooperativa cadastrada
                                </li>
                            )}
                            {cidade.cooperativas?.map((coop) => (
                                <li key={coop.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg group hover:bg-slate-100 transition-colors">
                                    <div>
                                        <span className="text-slate-800 text-sm font-medium">{coop.nome}</span>
                                        {coop.responsavel && (
                                            <span className="ml-2 text-slate-500 text-xs">({coop.responsavel})</span>
                                        )}
                                        {coop.telefone && (
                                            <span className="block text-slate-400 text-xs mt-0.5">{coop.telefone}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleViewCooperativa(coop)}
                                            className="text-slate-500 hover:text-slate-700 text-xs"
                                        >
                                            Ver
                                        </button>
                                        <button
                                            onClick={() => handleEditCooperativa(coop)}
                                            className="text-blue-500 hover:text-blue-600 text-xs"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCooperativa(coop.id)}
                                            className="text-red-500 hover:text-red-600 text-xs"
                                        >
                                            Remover
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="border-t border-slate-100 pt-4">
                            <button
                                onClick={() => {
                                    setEditingCooperativa(null);
                                    setCooperativaModalMode("create");
                                    setShowCooperativaModal(true);
                                }}
                                className="w-full bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-700 text-sm font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">+</span>
                                Adicionar Cooperativa
                            </button>
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

                        {/* Tabela (desktop) */}
                        <div className="hidden md:block overflow-x-auto max-h-96 overflow-y-auto mb-4">
                            <table className="w-full text-sm text-left text-slate-700">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2.5 font-medium">Nome</th>
                                        <th className="px-3 py-2.5 font-medium">Empresa</th>
                                        <th className="px-3 py-2.5 font-medium">Segmento</th>
                                        <th className="px-3 py-2.5 font-medium">Contato</th>
                                        <th className="px-3 py-2.5 font-medium text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cidade.empresarios?.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                                                Nenhum empresário cadastrado
                                            </td>
                                        </tr>
                                    )}
                                    {cidade.empresarios?.map((emp) => (
                                        <tr key={emp.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-3 py-2.5 font-medium text-slate-800">{emp.nome}</td>
                                            <td className="px-3 py-2.5 text-slate-600">{emp.empresa || "—"}</td>
                                            <td className="px-3 py-2.5">
                                                {emp.segmento ? (
                                                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{emp.segmento}</span>
                                                ) : "—"}
                                            </td>
                                            <td className="px-3 py-2.5 text-slate-600">{emp.telefone || emp.email || "—"}</td>
                                            <td className="px-3 py-2.5 text-right">
                                                <button onClick={() => handleEditEmpresario(emp)} className="text-blue-500 hover:text-blue-600 text-xs mr-2">Editar</button>
                                                <button onClick={() => handleDeleteEmpresario(emp.id)} className="text-red-500 hover:text-red-600 text-xs">Remover</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Lista (mobile) */}
                        <ul className="md:hidden space-y-2 max-h-96 overflow-y-auto mb-4">
                            {cidade.empresarios?.length === 0 && (
                                <li className="text-center text-slate-400 py-6 text-sm">
                                    Nenhum empresário cadastrado
                                </li>
                            )}
                            {cidade.empresarios?.map((emp) => (
                                <li key={emp.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg hover:bg-slate-100">
                                    <div>
                                        <span className="text-slate-800 text-sm font-medium">{emp.nome}</span>
                                        {emp.empresa && <span className="ml-2 text-slate-500 text-xs">({emp.empresa})</span>}
                                        {emp.segmento && <span className="ml-1 text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{emp.segmento}</span>}
                                        {(emp.telefone || emp.email) && <span className="block text-slate-400 text-xs mt-0.5">{emp.telefone || emp.email}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEditEmpresario(emp)} className="text-blue-500 hover:text-blue-600 text-xs">Editar</button>
                                        <button onClick={() => handleDeleteEmpresario(emp.id)} className="text-red-500 hover:text-red-600 text-xs">Remover</button>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <div className="border-t border-slate-100 pt-4">
                            <button
                                onClick={() => setShowEmpresarioModal(true)}
                                className="w-full bg-slate-800 text-white py-2.5 rounded-lg hover:bg-slate-700 text-sm font-medium transition-all flex items-center justify-center gap-2"
                            >
                                <span className="text-lg">+</span>
                                Adicionar Empresário
                            </button>
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

                    {/* Tabela (desktop) */}
                    <div className="hidden md:block overflow-x-auto max-h-96 overflow-y-auto mb-4">
                        <table className="w-full text-sm text-left text-slate-700">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200 sticky top-0">
                                <tr>
                                    <th className="px-3 py-2.5 font-medium">Nome</th>
                                    <th className="px-3 py-2.5 font-medium">Tipo</th>
                                    <th className="px-3 py-2.5 font-medium">Contato</th>
                                    <th className="px-3 py-2.5 font-medium text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cidade.imprensa?.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                                            Nenhum veículo de imprensa cadastrado
                                        </td>
                                    </tr>
                                )}
                                {cidade.imprensa?.map((imp) => (
                                    <tr key={imp.id} className="border-b border-slate-100 hover:bg-slate-50">
                                        <td className="px-3 py-2.5 font-medium text-slate-800">{imp.nome}</td>
                                        <td className="px-3 py-2.5">
                                            {imp.tipo ? (
                                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{imp.tipo}</span>
                                            ) : "—"}
                                        </td>
                                        <td className="px-3 py-2.5 text-slate-600">{imp.telefone || imp.email || imp.responsavel || "—"}</td>
                                        <td className="px-3 py-2.5 text-right">
                                            <button onClick={() => handleViewImprensa(imp)} className="text-slate-500 hover:text-slate-700 text-xs mr-2">Ver</button>
                                            <button onClick={() => handleEditImprensa(imp)} className="text-blue-500 hover:text-blue-600 text-xs mr-2">Editar</button>
                                            <button onClick={() => handleDeleteImprensa(imp.id)} className="text-red-500 hover:text-red-600 text-xs">Remover</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Cards (mobile) */}
                    <div className="md:hidden grid grid-cols-1 gap-3 mb-4 max-h-96 overflow-y-auto">
                        {cidade.imprensa?.length === 0 && (
                            <div className="text-center text-slate-400 py-8 text-sm">
                                Nenhum veículo de imprensa cadastrado
                            </div>
                        )}
                        {cidade.imprensa?.map((imp) => (
                            <div key={imp.id} className="bg-slate-50 p-3 rounded-lg hover:bg-slate-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-slate-800 text-sm font-medium">{imp.nome}</span>
                                            {imp.tipo && (
                                                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">{imp.tipo}</span>
                                            )}
                                        </div>
                                        {imp.responsavel && <p className="text-slate-500 text-xs mt-1">{imp.responsavel}</p>}
                                        {(imp.telefone || imp.email) && <p className="text-slate-400 text-xs">{imp.telefone || imp.email}</p>}
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                        <button onClick={() => handleViewImprensa(imp)} className="text-slate-500 hover:text-slate-700 text-xs">Ver</button>
                                        <button onClick={() => handleEditImprensa(imp)} className="text-blue-500 hover:text-blue-600 text-xs">Editar</button>
                                        <button onClick={() => handleDeleteImprensa(imp.id)} className="text-red-500 hover:text-red-600 text-xs">Remover</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                        <button
                            onClick={() => {
                                setEditingImprensa(null);
                                setImprensaModalMode("create");
                                setShowImprensaModal(true);
                            }}
                            className="w-full sm:w-auto bg-orange-600 text-white py-2.5 px-6 rounded-lg hover:bg-orange-700 text-sm font-medium transition-all flex items-center justify-center gap-2"
                        >
                            <span className="text-lg">+</span>
                            Adicionar Veículo de Imprensa
                        </button>
                    </div>
                </div>
            </div>

            {/* Modais */}
            <CooperativaModal
                isOpen={showCooperativaModal}
                onClose={handleCloseCooperativaModal}
                onSubmit={handleAddCooperativa}
                editingCooperativa={editingCooperativa}
                initialMode={cooperativaModalMode}
            />
            <EmpresarioModal
                isOpen={showEmpresarioModal}
                onClose={handleCloseEmpresarioModal}
                onSubmit={handleAddEmpresario}
                editingEmpresario={editingEmpresario}
            />
            <ImprensaModal
                isOpen={showImprensaModal}
                onClose={handleCloseImprensaModal}
                onSubmit={handleAddImprensa}
                editingImprensa={editingImprensa}
                initialMode={imprensaModalMode}
            />
        </div>
    );
}
