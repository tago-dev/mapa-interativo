"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CidadeCompleta } from "@/types/types";
import { fetchCityData } from "@/utils/supabase/city";

export default function CidadePage() {
    const params = useParams();
    const { id } = params;
    const [cidade, setCidade] = useState<CidadeCompleta | null>(null);
    const [loading, setLoading] = useState(true);

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
                    ...feature.properties
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

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
            <p className="mt-3 text-slate-500 text-sm">Carregando...</p>
        </div>
    );
    if (!cidade) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <p className="text-slate-500">Cidade não encontrada.</p>
            <Link href="/app/mapa" className="mt-4 text-slate-600 hover:text-slate-800 text-sm">
                ← Voltar ao mapa
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{cidade.name}</h1>
                        <p className="text-slate-500 text-sm mt-1">{cidade.mesorregiao}</p>
                    </div>
                    <Link href="/app/mapa" className="text-sm text-slate-500 hover:text-slate-700">
                        ← Voltar ao Mapa
                    </Link>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs text-slate-500 uppercase">Eleitores</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{cidade.eleitores?.toLocaleString() || "—"}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs text-slate-500 uppercase">Votos Prefeito</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{cidade.total_votos?.toLocaleString() || "—"}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-green-200 p-4">
                        <p className="text-xs text-green-600 uppercase">Apoio</p>
                        <p className="text-xl font-bold text-green-600 mt-1">{cidade.apoio || 0}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-red-200 p-4">
                        <p className="text-xs text-red-600 uppercase">Oposição</p>
                        <p className="text-xl font-bold text-red-600 mt-1">{cidade.nao_apoio || 0}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Executivo */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Poder Executivo</h2>

                        <div className="space-y-4">
                            <div className="border-b border-slate-100 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Prefeito</p>
                                        <p className="text-lg font-semibold text-slate-800 mt-1">{cidade.prefeito || "Não informado"}</p>
                                        {cidade.status_prefeito && (
                                            <span className="inline-block text-xs text-green-600 mt-1">{cidade.status_prefeito}</span>
                                        )}
                                    </div>
                                    {cidade.partido && (
                                        <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">{cidade.partido}</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Vice-Prefeito</p>
                                        <p className="text-base font-medium text-slate-800 mt-1">{cidade.vice_prefeito || "Não informado"}</p>
                                        {cidade.status_vice && (
                                            <span className="inline-block text-xs text-green-600 mt-1">{cidade.status_vice}</span>
                                        )}
                                    </div>
                                    {cidade.partido_vice && (
                                        <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded">{cidade.partido_vice}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vereadores */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                            Vereadores ({cidade.vereadores?.length || 0})
                        </h2>

                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {cidade.vereadores?.map((ver, idx) => (
                                <div key={ver.id || idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                    <span className="text-sm text-slate-700">{ver.nome}</span>
                                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">{ver.partido}</span>
                                </div>
                            ))}
                            {(!cidade.vereadores || cidade.vereadores.length === 0) && (
                                <p className="text-slate-400 text-sm">Nenhum vereador cadastrado.</p>
                            )}
                        </div>
                    </div>

                    {/* Cooperativas */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                            Cooperativas ({cidade.cooperativas?.length || 0})
                        </h2>

                        <div className="space-y-2">
                            {cidade.cooperativas?.map((coop, idx) => (
                                <div key={coop.id || idx} className="py-2 border-b border-slate-50 last:border-0">
                                    <span className="text-sm text-slate-700">{coop.nome}</span>
                                </div>
                            ))}
                            {(!cidade.cooperativas || cidade.cooperativas.length === 0) && (
                                <p className="text-slate-400 text-sm">Nenhuma cooperativa cadastrada.</p>
                            )}
                        </div>
                    </div>

                    {/* Empresários */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                            Empresários ({cidade.empresarios?.length || 0})
                        </h2>

                        <div className="space-y-2">
                            {cidade.empresarios?.map((emp, idx) => (
                                <div key={emp.id || idx} className="py-2 border-b border-slate-50 last:border-0">
                                    <span className="text-sm text-slate-700">{emp.nome}</span>
                                </div>
                            ))}
                            {(!cidade.empresarios || cidade.empresarios.length === 0) && (
                                <p className="text-slate-400 text-sm">Nenhum empresário cadastrado.</p>
                            )}
                        </div>
                    </div>

                    {/* Imprensa */}
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                            Imprensa ({cidade.imprensa?.length || 0})
                        </h2>

                        <div className="space-y-2">
                            {cidade.imprensa?.map((imp, idx) => (
                                <div key={imp.id || idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                    <div>
                                        <span className="text-sm text-slate-700">{imp.nome}</span>
                                        {imp.contato && (
                                            <p className="text-xs text-slate-400 mt-0.5">{imp.contato}</p>
                                        )}
                                    </div>
                                    {imp.tipo && (
                                        <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">{imp.tipo}</span>
                                    )}
                                </div>
                            ))}
                            {(!cidade.imprensa || cidade.imprensa.length === 0) && (
                                <p className="text-slate-400 text-sm">Nenhuma imprensa cadastrada.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
