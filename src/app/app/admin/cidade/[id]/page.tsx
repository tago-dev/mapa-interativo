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

    if (loading) return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    if (!cidade) return <div className="flex justify-center items-center h-screen">Cidade não encontrada.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Administração: {cidade.name}</h1>
                    <div className="flex gap-2">
                        <Link href={`/app/cidade/${encodeURIComponent(cidade.id)}`} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                            Ver Página Pública
                        </Link>
                        <Link href="/app/mapa" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">
                            Voltar ao Mapa
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Dados Gerais */}
                    <div className="bg-white p-6 rounded-lg shadow space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2">Dados Gerais</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Prefeito</label>
                                <input name="prefeito" value={formData.prefeito || ""} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Partido</label>
                                <input name="partido" value={formData.partido || ""} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status Prefeito</label>
                                <input name="status_prefeito" value={formData.status_prefeito || ""} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Total Votos</label>
                                <input type="number" name="total_votos" value={formData.total_votos || 0} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vice-Prefeito</label>
                                <input name="vice_prefeito" value={formData.vice_prefeito || ""} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Partido Vice</label>
                                <input name="partido_vice" value={formData.partido_vice || ""} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Status Vice</label>
                                <input name="status_vice" value={formData.status_vice || ""} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Eleitores</label>
                                <input type="number" name="eleitores" value={formData.eleitores || 0} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Apoio (Votos)</label>
                                <input type="number" name="apoio" value={formData.apoio || 0} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Não Apoio (Votos)</label>
                                <input type="number" name="nao_apoio" value={formData.nao_apoio || 0} onChange={handleInputChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2" />
                            </div>
                        </div>
                        <button onClick={handleSaveCity} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Salvar Dados Gerais</button>
                    </div>

                    {/* Vereadores */}
                    <div className="bg-white p-6 rounded-lg shadow space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2">Vereadores</h2>
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {cidade.vereadores?.map((ver) => (
                                <li key={ver.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span>{ver.nome} ({ver.partido})</span>
                                    <button onClick={() => handleDeleteVereador(ver.id)} className="text-red-500 hover:text-red-700">Excluir</button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 border-t pt-4">
                            <input placeholder="Nome" value={newVereador.nome} onChange={(e) => setNewVereador({ ...newVereador, nome: e.target.value })} className="flex-1 border p-2 rounded" />
                            <input placeholder="Partido" value={newVereador.partido} onChange={(e) => setNewVereador({ ...newVereador, partido: e.target.value })} className="w-24 border p-2 rounded" />
                            <button onClick={handleAddVereador} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">Add</button>
                        </div>
                    </div>

                    {/* Cooperativas */}
                    <div className="bg-white p-6 rounded-lg shadow space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2">Cooperativas</h2>
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {cidade.cooperativas?.map((coop) => (
                                <li key={coop.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span>{coop.nome}</span>
                                    <button onClick={() => handleDeleteCooperativa(coop.id)} className="text-red-500 hover:text-red-700">Excluir</button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 border-t pt-4">
                            <input placeholder="Nome da Cooperativa" value={newCooperativa.nome} onChange={(e) => setNewCooperativa({ ...newCooperativa, nome: e.target.value })} className="flex-1 border p-2 rounded" />
                            <button onClick={handleAddCooperativa} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">Add</button>
                        </div>
                    </div>

                    {/* Empresários */}
                    <div className="bg-white p-6 rounded-lg shadow space-y-4">
                        <h2 className="text-xl font-bold border-b pb-2">Empresários</h2>
                        <ul className="space-y-2 max-h-60 overflow-y-auto">
                            {cidade.empresarios?.map((emp) => (
                                <li key={emp.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span>{emp.nome}</span>
                                    <button onClick={() => handleDeleteEmpresario(emp.id)} className="text-red-500 hover:text-red-700">Excluir</button>
                                </li>
                            ))}
                        </ul>
                        <div className="flex gap-2 border-t pt-4">
                            <input placeholder="Nome do Empresário" value={newEmpresario.nome} onChange={(e) => setNewEmpresario({ ...newEmpresario, nome: e.target.value })} className="flex-1 border p-2 rounded" />
                            <button onClick={handleAddEmpresario} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">Add</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
