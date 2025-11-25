"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CidadeCompleta } from "@/types/types";
import {
    fetchCityData,
    updateCityData,
    addVereador,
    deleteVereador,
    addCooperativa,
    deleteCooperativa,
    addEmpresario,
    deleteEmpresario
} from "@/utils/supabase/city";

export default function CidadePage() {
    const params = useParams();
    const { id } = params;
    const [cidade, setCidade] = useState<CidadeCompleta | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

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

                // Se dbData existe, usa seus arrays. Se não, usa vazios (não usamos mais mock arrays do geojson para edição)
                if (dbData) {
                    finalData.vereadores = dbData.vereadores;
                    finalData.cooperativas = dbData.cooperativas;
                    finalData.empresarios = dbData.empresarios;
                } else {
                    // Se não tem no DB, inicializa arrays vazios para começar a editar
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
            // Atualiza apenas dados da tabela cidades
            const cityUpdate = {
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

            await updateCityData(cidade.id, cityUpdate);
            setIsEditing(false);
            loadData(); // Recarrega para garantir sincronia
            alert("Dados salvos com sucesso!");
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

    if (loading) return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    if (!cidade) return <div className="flex justify-center items-center h-screen">Cidade não encontrada.</div>;

    return (
        <div className="min-h-screen bg-white p-8 font-sans relative">
            {/* Botão de Voltar e Editar */}
            <div className="absolute top-4 right-4 flex gap-2 z-50">
                <Link href="/app/mapa" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">
                    Voltar ao Mapa
                </Link>
                <button
                    onClick={() => (isEditing ? handleSaveCity() : setIsEditing(true))}
                    className={`${isEditing ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"
                        } text-white px-4 py-2 rounded`}
                >
                    {isEditing ? "Salvar Alterações" : "Editar Informações"}
                </button>
            </div>

            {/* Cabeçalho: Cidade e Eleitores */}
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-start">
                <div className="bg-[#5D4037] text-white px-8 py-4 rounded-2xl shadow-lg relative">
                    <span className="absolute -top-3 left-6 bg-[#5D4037] text-xs px-2 py-1 rounded border border-white/20">
                        {cidade.mesorregiao || "MESORREGIÃO"}
                    </span>
                    <h1 className="text-4xl font-bold uppercase tracking-wider mt-2">{cidade.name}</h1>
                </div>

                <div className="bg-[#1F2937] text-white px-6 py-4 rounded-2xl shadow-lg flex flex-col justify-center min-w-[200px]">
                    <span className="text-xs text-gray-400 uppercase font-bold">Eleitores Cidade</span>
                    {isEditing ? (
                        <input
                            type="number"
                            name="eleitores"
                            value={formData.eleitores || 0}
                            onChange={handleInputChange}
                            className="text-white bg-gray-700 rounded px-2 py-1 w-full"
                        />
                    ) : (
                        <span className="text-3xl font-bold">{cidade.eleitores?.toLocaleString()}</span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Esquerda: Prefeito e Vice */}
                <div className="space-y-6 lg:col-span-2">
                    {/* Card Prefeito */}
                    <div className="relative pl-12">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-white border-2 border-[#FCD34D] rounded-full flex items-center justify-center z-10 shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                        <div className="bg-[#FEF3C7] p-4 rounded-r-2xl rounded-bl-2xl ml-8 shadow-sm border-l-8 border-[#FCD34D]">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-[#FCD34D] text-[#78350F] font-bold px-3 py-1 rounded-full text-sm uppercase">
                                    Prefeito
                                </span>
                                <div className="flex gap-2">
                                    <span className="bg-[#1F2937] text-white text-xs px-2 py-1 rounded">
                                        {isEditing ? (
                                            <input name="partido" value={formData.partido || ""} onChange={handleInputChange} className="bg-gray-700 w-16 px-1" placeholder="PARTIDO" />
                                        ) : cidade.partido}
                                    </span>
                                </div>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="w-full mr-4">
                                    {isEditing ? (
                                        <input name="prefeito" value={formData.prefeito || ""} onChange={handleInputChange} className="text-xl font-bold text-gray-800 bg-white/50 w-full mb-1 px-1" placeholder="Nome do Prefeito" />
                                    ) : (
                                        <h2 className="text-2xl font-bold text-gray-800">{cidade.prefeito || "Não informado"}</h2>
                                    )}
                                    <div className="flex gap-2 mt-1 items-center">
                                        <span className="text-sm text-gray-600">Status:</span>
                                        {isEditing ? (
                                            <input name="status_prefeito" value={formData.status_prefeito || ""} onChange={handleInputChange} className="bg-white/50 px-1 text-sm" placeholder="Ex: Reeleito" />
                                        ) : (
                                            <span className="text-sm font-medium">{cidade.status_prefeito}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-[#1F2937] text-white px-3 py-1 rounded text-center min-w-[80px]">
                                    <span className="text-[10px] block text-gray-400">TOTAL VOTOS</span>
                                    <span className="font-bold">
                                        {isEditing ? <input name="total_votos" value={formData.total_votos || 0} onChange={handleInputChange} className="bg-gray-700 w-full text-center" /> : cidade.total_votos?.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card Vice-Prefeito */}
                    <div className="relative pl-12">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-16 h-16 bg-white border-2 border-[#FCD34D] rounded-full flex items-center justify-center z-10 shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                            </svg>
                        </div>
                        <div className="bg-[#FEF3C7] p-4 rounded-r-2xl rounded-bl-2xl ml-8 shadow-sm border-l-8 border-[#FCD34D]">
                            <div className="flex justify-between items-start mb-2">
                                <span className="bg-[#FCD34D] text-[#78350F] font-bold px-3 py-1 rounded-full text-sm uppercase">
                                    Vice-Prefeito
                                </span>
                                <span className="bg-[#1F2937] text-white text-xs px-2 py-1 rounded">
                                    {isEditing ? (
                                        <input name="partido_vice" value={formData.partido_vice || ""} onChange={handleInputChange} className="bg-gray-700 w-16 px-1" placeholder="PARTIDO" />
                                    ) : cidade.partido_vice}
                                </span>
                            </div>
                            <div>
                                {isEditing ? (
                                    <input name="vice_prefeito" value={formData.vice_prefeito || ""} onChange={handleInputChange} className="text-xl font-bold text-gray-800 bg-white/50 w-full mb-1 px-1" placeholder="Nome do Vice" />
                                ) : (
                                    <h2 className="text-2xl font-bold text-gray-800">{cidade.vice_prefeito || "Não informado"}</h2>
                                )}
                                <div className="flex gap-2 mt-1 items-center">
                                    <span className="text-sm text-gray-600">Status:</span>
                                    {isEditing ? (
                                        <input name="status_vice" value={formData.status_vice || ""} onChange={handleInputChange} className="bg-white/50 px-1 text-sm" placeholder="Ex: Eleito" />
                                    ) : (
                                        <span className="text-sm font-medium">{cidade.status_vice}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Seção de Vereadores */}
                    <div className="bg-[#FEF3C7] p-6 rounded-3xl shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="bg-[#1F4B43] p-2 rounded-full text-white">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-[#1F4B43] uppercase">Vereadores</h3>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {cidade.vereadores?.map((ver, idx) => (
                                <div key={ver.id || idx} className="flex justify-between items-center border-b border-gray-300 pb-2">
                                    <div className="flex-1">
                                        <span className="font-medium">{ver.nome}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-600 bg-white/50 px-2 py-1 rounded text-sm">{ver.partido}</span>
                                        {isEditing && (
                                            <button
                                                onClick={() => handleDeleteVereador(ver.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Remover"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isEditing && (
                                <div className="flex gap-2 mt-4 pt-2 border-t border-gray-300">
                                    <input
                                        placeholder="Nome do Vereador"
                                        value={newVereador.nome}
                                        onChange={(e) => setNewVereador({ ...newVereador, nome: e.target.value })}
                                        className="flex-1 px-3 py-1 rounded border border-gray-300"
                                    />
                                    <input
                                        placeholder="Partido"
                                        value={newVereador.partido}
                                        onChange={(e) => setNewVereador({ ...newVereador, partido: e.target.value })}
                                        className="w-24 px-3 py-1 rounded border border-gray-300"
                                    />
                                    <button
                                        onClick={handleAddVereador}
                                        className="bg-[#1F4B43] text-white px-3 py-1 rounded hover:bg-[#163832]"
                                    >
                                        Adicionar
                                    </button>
                                </div>
                            )}

                            {(!cidade.vereadores || cidade.vereadores.length === 0) && !isEditing && (
                                <p className="text-gray-500 italic">Nenhum vereador listado.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Coluna Direita: Apoio, Mapa, Cooperativas, Empresários */}
                <div className="space-y-6">
                    {/* Placar Apoio/Não */}
                    <div className="flex justify-center gap-4">
                        <div className="bg-[#22C55E] text-white p-4 rounded-2xl shadow-lg w-32 text-center relative">
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1F2937] text-white text-xs font-bold px-3 py-1 rounded-full">
                                APOIO
                            </span>
                            {isEditing ? (
                                <input
                                    type="number"
                                    name="apoio"
                                    value={formData.apoio || 0}
                                    onChange={handleInputChange}
                                    className="text-5xl font-bold w-full bg-transparent text-center"
                                />
                            ) : (
                                <span className="text-6xl font-bold">{cidade.apoio || 0}</span>
                            )}
                        </div>
                        <div className="bg-[#EF4444] text-white p-4 rounded-2xl shadow-lg w-32 text-center relative">
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#1F2937] text-white text-xs font-bold px-3 py-1 rounded-full">
                                NÃO
                            </span>
                            {isEditing ? (
                                <input
                                    type="number"
                                    name="nao_apoio"
                                    value={formData.nao_apoio || 0}
                                    onChange={handleInputChange}
                                    className="text-5xl font-bold w-full bg-transparent text-center"
                                />
                            ) : (
                                <span className="text-6xl font-bold">{cidade.nao_apoio || 0}</span>
                            )}
                        </div>
                    </div>

                    {/* Mapa Highlight (Placeholder) */}
                    <div className="bg-[#5D4037] p-4 rounded-3xl h-48 flex items-center justify-center shadow-lg">
                        <div className="text-[#FCD34D]">
                            <svg className="w-32 h-32" viewBox="0 0 100 100" fill="currentColor">
                                <path d="M50 10 L90 30 L80 80 L20 80 L10 30 Z" />
                            </svg>
                        </div>
                    </div>

                    {/* Cooperativas */}
                    <div className="bg-[#FEF3C7] p-6 rounded-3xl shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#1F4B43] p-2 rounded-full text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-[#1F4B43] uppercase">Cooperativas</h3>
                        </div>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {cidade.cooperativas?.map((coop, idx) => (
                                <li key={coop.id || idx} className="flex justify-between items-center">
                                    <span>{coop.nome}</span>
                                    {isEditing && (
                                        <button
                                            onClick={() => handleDeleteCooperativa(coop.id)}
                                            className="text-red-500 hover:text-red-700 ml-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {isEditing && (
                            <div className="flex gap-2 mt-4 pt-2 border-t border-gray-300">
                                <input
                                    placeholder="Nova Cooperativa"
                                    value={newCooperativa.nome}
                                    onChange={(e) => setNewCooperativa({ ...newCooperativa, nome: e.target.value })}
                                    className="flex-1 px-3 py-1 rounded border border-gray-300"
                                />
                                <button
                                    onClick={handleAddCooperativa}
                                    className="bg-[#1F4B43] text-white px-3 py-1 rounded hover:bg-[#163832]"
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Empresários */}
                    <div className="bg-[#FEF3C7] p-6 rounded-3xl shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-[#1F4B43] p-2 rounded-full text-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-[#1F4B43] uppercase">Empresários</h3>
                        </div>
                        <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {cidade.empresarios?.map((emp, idx) => (
                                <li key={emp.id || idx} className="flex justify-between items-center">
                                    <span>{emp.nome}</span>
                                    {isEditing && (
                                        <button
                                            onClick={() => handleDeleteEmpresario(emp.id)}
                                            className="text-red-500 hover:text-red-700 ml-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                        {isEditing && (
                            <div className="flex gap-2 mt-4 pt-2 border-t border-gray-300">
                                <input
                                    placeholder="Novo Empresário"
                                    value={newEmpresario.nome}
                                    onChange={(e) => setNewEmpresario({ ...newEmpresario, nome: e.target.value })}
                                    className="flex-1 px-3 py-1 rounded border border-gray-300"
                                />
                                <button
                                    onClick={handleAddEmpresario}
                                    className="bg-[#1F4B43] text-white px-3 py-1 rounded hover:bg-[#163832]"
                                >
                                    +
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
