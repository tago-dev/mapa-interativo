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

    const normalizeWebsiteUrl = (website?: string) => {
        if (!website) return "";
        const trimmed = website.trim();
        if (!trimmed) return "";
        return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    };

    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const cityId = decodeURIComponent(id as string);

            // 1. Buscar dados básicos do GeoJSON
            const res = await fetch("/data/municipios.json");
            const data = await res.json();
            const feature = data.features.find((f: { id?: string | number; properties: { id?: string | number; name?: string; [key: string]: unknown } }) =>
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

    const apoio = cidade.apoio || 0;
    const naoApoio = cidade.nao_apoio || 0;
    const totalPosicionamento = apoio + naoApoio;
    const percentualApoio = totalPosicionamento > 0 ? Math.round((apoio / totalPosicionamento) * 100) : 0;
    const percentualNaoApoio = totalPosicionamento > 0 ? 100 - percentualApoio : 0;
    const getStatusStyle = (statusValue?: string) => {
        const normalizedStatus = (statusValue || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

        const nameColorClass =
            normalizedStatus === "aliado"
                ? "text-green-700"
                : normalizedStatus === "neutro"
                    ? "text-amber-700"
                    : normalizedStatus === "oposicao"
                        ? "text-red-700"
                        : "text-slate-800";

        const statusColorClass =
            normalizedStatus === "aliado"
                ? "text-green-700 bg-green-50 border border-green-200"
                : normalizedStatus === "neutro"
                    ? "text-amber-700 bg-amber-50 border border-amber-200"
                    : normalizedStatus === "oposicao"
                        ? "text-red-700 bg-red-50 border border-red-200"
                        : "text-slate-600 bg-slate-100 border border-slate-200";

        return { nameColorClass, statusColorClass };
    };

    const getVereadorPosicaoStyle = (statusValue?: string) => {
        const normalizedStatus = (statusValue || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

        if (normalizedStatus === "aliado") {
            return {
                rowClass: "bg-green-50/60 border border-green-100",
                badgeClass: "text-green-700 bg-green-100",
                label: "Aliado",
            };
        }

        if (normalizedStatus === "oposicao") {
            return {
                rowClass: "bg-red-50/60 border border-red-100",
                badgeClass: "text-red-700 bg-red-100",
                label: "Oposição",
            };
        }

        return {
            rowClass: "bg-amber-50/60 border border-amber-100",
            badgeClass: "text-amber-700 bg-amber-100",
            label: "Neutro",
        };
    };

    const prefeitoStatus = (cidade.status_prefeito || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();
    const viceStatus = (cidade.status_vice || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLowerCase();

    const { nameColorClass: prefeitoNameColorClass, statusColorClass: prefeitoStatusColorClass } = getStatusStyle(prefeitoStatus);
    const { nameColorClass: viceNameColorClass, statusColorClass: viceStatusColorClass } = getStatusStyle(viceStatus);

    return (
        <div className="min-h-screen bg-slate-100 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{cidade.name}</h1>
                        <p className="text-slate-500 text-sm mt-1">{cidade.mesorregiao}</p>
                    </div>
                    <Link href="/app/mapa" className="text-sm text-slate-500 hover:text-slate-700">
                        ← Voltar ao Mapa
                    </Link>
                </div>

                {/* Posicionamento político */}
                <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-5">
                        <div>
                            <h2 className="text-base font-semibold text-slate-800">Posicionamento na Câmara</h2>
                            <p className="text-sm text-slate-500">Quem apoia e quem não apoia no legislativo municipal.</p>
                        </div>
                        <p className="text-xs text-slate-500">
                            Total considerado: <span className="font-semibold text-slate-700">{totalPosicionamento}</span>
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="rounded-lg border border-green-200 bg-green-50/40 p-4">
                            <p className="text-xs font-semibold uppercase text-green-700">Apoia</p>
                            <p className="text-3xl font-bold text-green-700 mt-1">{apoio}</p>
                            <p className="text-sm text-green-700 mt-1">{percentualApoio}% do total</p>
                        </div>
                        <div className="rounded-lg border border-red-200 bg-red-50/40 p-4">
                            <p className="text-xs font-semibold uppercase text-red-700">Não apoia</p>
                            <p className="text-3xl font-bold text-red-700 mt-1">{naoApoio}</p>
                            <p className="text-sm text-red-700 mt-1">{percentualNaoApoio}% do total</p>
                        </div>
                    </div>

                    {totalPosicionamento > 0 ? (
                        <div>
                            <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden flex">
                                <div
                                    className="h-full bg-green-600"
                                    style={{ width: `${percentualApoio}%` }}
                                    aria-label={`Apoio: ${percentualApoio}%`}
                                />
                                <div
                                    className="h-full bg-red-600"
                                    style={{ width: `${percentualNaoApoio}%` }}
                                    aria-label={`Não apoio: ${percentualNaoApoio}%`}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Proporção calculada com base nos valores cadastrados de apoio e não apoio.
                            </p>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
                            Ainda não há dados de apoio e não apoio cadastrados para esta cidade.
                        </p>
                    )}
                </section>

                {/* Indicadores gerais */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs text-slate-500 uppercase">Eleitores</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{cidade.eleitores?.toLocaleString() || "—"}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs text-slate-500 uppercase">Votos Válidos</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{cidade.votos_validos?.toLocaleString() || "—"}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-4">
                        <p className="text-xs text-slate-500 uppercase">Votos Prefeito</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{cidade.total_votos?.toLocaleString() || "—"}</p>
                    </div>
                </div>

                {/* Bloco político */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Poder Executivo</h2>

                        <div className="space-y-4">
                            <div className="border-b border-slate-100 pb-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-slate-500 uppercase">Prefeito</p>
                                        <p className={`text-lg font-semibold mt-1 ${prefeitoNameColorClass}`}>{cidade.prefeito || "Não informado"}</p>
                                        {cidade.status_prefeito && (
                                            <span className={`inline-block text-xs mt-1 px-2 py-0.5 rounded-full ${prefeitoStatusColorClass}`}>
                                                {cidade.status_prefeito}
                                            </span>
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
                                        <p className={`text-base font-medium mt-1 ${viceNameColorClass}`}>{cidade.vice_prefeito || "Não informado"}</p>
                                        {cidade.status_vice && (
                                            <span className={`inline-block text-xs mt-1 px-2 py-0.5 rounded-full ${viceStatusColorClass}`}>
                                                {cidade.status_vice}
                                            </span>
                                        )}
                                    </div>
                                    {cidade.partido_vice && (
                                        <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-1 rounded">{cidade.partido_vice}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">
                            Vereadores ({cidade.vereadores?.length || 0})
                        </h2>

                        <div className="max-h-64 overflow-y-auto space-y-2">
                            {cidade.vereadores?.map((ver, idx) => (
                                <div
                                    key={ver.id || idx}
                                    className={`flex justify-between items-center py-2 px-2 rounded-md ${getVereadorPosicaoStyle(ver.posicao).rowClass}`}
                                >
                                    <span className="text-sm text-slate-700">{ver.nome}</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${getVereadorPosicaoStyle(ver.posicao).badgeClass}`}>
                                            {getVereadorPosicaoStyle(ver.posicao).label}
                                        </span>
                                        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                                            {ver.partido || "—"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {(!cidade.vereadores || cidade.vereadores.length === 0) && (
                                <p className="text-slate-400 text-sm">Nenhum vereador cadastrado.</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Blocos setoriais */}
                <section className="space-y-6">
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Cooperativas ({cidade.cooperativas?.length || 0})
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">Dados cadastrados no painel administrativo.</p>

                        <div className="space-y-3">
                            {cidade.cooperativas?.map((coop, idx) => (
                                <div key={coop.id || idx} className="rounded-lg border border-slate-200 p-4">
                                    <h3 className="text-sm font-semibold text-slate-800">{coop.nome}</h3>
                                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                                        {coop.responsavel && <p><span className="font-medium text-slate-700">Responsável:</span> {coop.responsavel}</p>}
                                        {coop.telefone && (
                                            <p>
                                                <span className="font-medium text-slate-700">Telefone:</span>{" "}
                                                <a href={`tel:${coop.telefone}`} className="text-blue-600 hover:underline">{coop.telefone}</a>
                                            </p>
                                        )}
                                        {coop.email && (
                                            <p>
                                                <span className="font-medium text-slate-700">Email:</span>{" "}
                                                <a href={`mailto:${coop.email}`} className="text-blue-600 hover:underline break-all">{coop.email}</a>
                                            </p>
                                        )}
                                        {coop.endereco && <p><span className="font-medium text-slate-700">Endereço:</span> {coop.endereco}</p>}
                                        {coop.observacoes && <p><span className="font-medium text-slate-700">Observações:</span> {coop.observacoes}</p>}
                                    </div>
                                </div>
                            ))}
                            {(!cidade.cooperativas || cidade.cooperativas.length === 0) && (
                                <p className="text-slate-400 text-sm">Nenhuma cooperativa cadastrada.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Empresários ({cidade.empresarios?.length || 0})
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">Dados cadastrados no painel administrativo.</p>

                        <div className="space-y-3">
                            {cidade.empresarios?.map((emp, idx) => (
                                <div key={emp.id || idx} className="rounded-lg border border-slate-200 p-4">
                                    <h3 className="text-sm font-semibold text-slate-800">{emp.nome}</h3>
                                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                                        {emp.empresa && <p><span className="font-medium text-slate-700">Empresa:</span> {emp.empresa}</p>}
                                        {emp.segmento && <p><span className="font-medium text-slate-700">Segmento:</span> {emp.segmento}</p>}
                                        {emp.responsavel && <p><span className="font-medium text-slate-700">Responsável:</span> {emp.responsavel}</p>}
                                        {emp.telefone && (
                                            <p>
                                                <span className="font-medium text-slate-700">Telefone:</span>{" "}
                                                <a href={`tel:${emp.telefone}`} className="text-blue-600 hover:underline">{emp.telefone}</a>
                                            </p>
                                        )}
                                        {emp.email && (
                                            <p>
                                                <span className="font-medium text-slate-700">Email:</span>{" "}
                                                <a href={`mailto:${emp.email}`} className="text-blue-600 hover:underline break-all">{emp.email}</a>
                                            </p>
                                        )}
                                        {emp.endereco && <p><span className="font-medium text-slate-700">Endereço:</span> {emp.endereco}</p>}
                                        {emp.observacoes && <p><span className="font-medium text-slate-700">Observações:</span> {emp.observacoes}</p>}
                                    </div>
                                </div>
                            ))}
                            {(!cidade.empresarios || cidade.empresarios.length === 0) && (
                                <p className="text-slate-400 text-sm">Nenhum empresário cadastrado.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">
                            Imprensa ({cidade.imprensa?.length || 0})
                        </h2>
                        <p className="text-sm text-slate-500 mb-4">Dados cadastrados no painel administrativo.</p>

                        <div className="space-y-3">
                            {cidade.imprensa?.map((imp, idx) => (
                                <div key={imp.id || idx} className="rounded-lg border border-slate-200 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="text-sm font-semibold text-slate-800">{imp.nome}</h3>
                                        {imp.tipo && (
                                            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">{imp.tipo}</span>
                                        )}
                                    </div>
                                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                                        {imp.responsavel && <p><span className="font-medium text-slate-700">Responsável:</span> {imp.responsavel}</p>}
                                        {imp.telefone && (
                                            <p>
                                                <span className="font-medium text-slate-700">Telefone:</span>{" "}
                                                <a href={`tel:${imp.telefone}`} className="text-blue-600 hover:underline">{imp.telefone}</a>
                                            </p>
                                        )}
                                        {imp.email && (
                                            <p>
                                                <span className="font-medium text-slate-700">Email:</span>{" "}
                                                <a href={`mailto:${imp.email}`} className="text-blue-600 hover:underline break-all">{imp.email}</a>
                                            </p>
                                        )}
                                        {imp.website && (
                                            <p>
                                                <span className="font-medium text-slate-700">Website:</span>{" "}
                                                <a
                                                    href={normalizeWebsiteUrl(imp.website)}
                                                    target="_blank"
                                                    rel="noreferrer noopener"
                                                    className="text-blue-600 hover:underline break-all"
                                                >
                                                    {imp.website}
                                                </a>
                                            </p>
                                        )}
                                        {imp.endereco && <p><span className="font-medium text-slate-700">Endereço:</span> {imp.endereco}</p>}
                                        {imp.observacoes && <p><span className="font-medium text-slate-700">Observações:</span> {imp.observacoes}</p>}
                                    </div>
                                </div>
                            ))}
                            {(!cidade.imprensa || cidade.imprensa.length === 0) && (
                                <p className="text-slate-400 text-sm">Nenhuma imprensa cadastrada.</p>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
