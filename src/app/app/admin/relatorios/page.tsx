"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import RelatorioCidadesFiltros from "./components/RelatorioCidadesFiltros";
import RelatorioCidadesTable from "./components/RelatorioCidadesTable";

type RelatorioCidade = {
    id: string;
    name: string;
    mesorregiao: string | null;
    prefeito: string | null;
    partido: string | null;
    status_prefeito: string | null;
    status_vice: string | null;
    eleitores: number | null;
    votos_validos: number | null;
    total_votos: number | null;
};

type Filtros = {
    search: string;
    mesorregiao: string;
    statusPrefeito: string;
    statusVice: string;
    eleitoresMin: string;
    eleitoresMax: string;
    votosValidosMin: string;
    votosValidosMax: string;
    totalVotosMin: string;
    totalVotosMax: string;
};

type ApiResponse = {
    data: RelatorioCidade[];
    meta: { count: number };
};

const filtrosIniciais: Filtros = {
    search: "",
    mesorregiao: "all",
    statusPrefeito: "all",
    statusVice: "all",
    eleitoresMin: "",
    eleitoresMax: "",
    votosValidosMin: "",
    votosValidosMax: "",
    totalVotosMin: "",
    totalVotosMax: "",
};

const formatNumber = (value: number | null) =>
    value === null || value === undefined ? "" : String(value);

const csvEscape = (value: string | number | null) => {
    const stringValue = value === null || value === undefined ? "" : String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
};

export default function RelatoriosPage() {
    const [filtros, setFiltros] = useState<Filtros>(filtrosIniciais);
    const [appliedFilters, setAppliedFilters] = useState<Filtros>(filtrosIniciais);
    const [rows, setRows] = useState<RelatorioCidade[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);
    const [generatedAt, setGeneratedAt] = useState<string>(new Date().toISOString());

    const fetchRelatorio = useCallback(async (filters: Filtros) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.set(key, value);
            });

            const response = await fetch(`/api/admin/relatorios/cidades?${params.toString()}`);
            if (!response.ok) throw new Error("Falha ao carregar relatório");

            const result: ApiResponse = await response.json();
            setRows(result.data ?? []);
            setCount(result.meta?.count ?? 0);
            setGeneratedAt(new Date().toISOString());
        } catch (fetchError) {
            console.error(fetchError);
            setError("Não foi possível carregar o relatório no momento.");
            setRows([]);
            setCount(0);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRelatorio(appliedFilters);
    }, [appliedFilters, fetchRelatorio]);

    const mesorregioes = useMemo(() => {
        return Array.from(new Set(rows.map((row) => row.mesorregiao).filter(Boolean) as string[])).sort((a, b) =>
            a.localeCompare(b, "pt-BR")
        );
    }, [rows]);

    const statusOptions = useMemo(() => {
        return Array.from(
            new Set(
                rows
                    .flatMap((row) => [row.status_prefeito, row.status_vice])
                    .filter(Boolean) as string[]
            )
        ).sort((a, b) => a.localeCompare(b, "pt-BR"));
    }, [rows]);

    const handleFiltroChange = <K extends keyof Filtros>(field: K, value: Filtros[K]) => {
        setFiltros((prev) => ({ ...prev, [field]: value }));
    };

    const handleApplyFilters = () => {
        setAppliedFilters(filtros);
    };

    const handleClearFilters = () => {
        setFiltros(filtrosIniciais);
        setAppliedFilters(filtrosIniciais);
    };

    const handleExportCSV = () => {
        if (rows.length === 0) return;

        const header = [
            "Cidade",
            "Mesorregiao",
            "Prefeito",
            "Partido",
            "Status Prefeito",
            "Status Vice",
            "Eleitores",
            "Votos Validos",
            "Total Votos",
        ];

        const body = rows.map((row) => [
            csvEscape(row.name),
            csvEscape(row.mesorregiao),
            csvEscape(row.prefeito),
            csvEscape(row.partido),
            csvEscape(row.status_prefeito),
            csvEscape(row.status_vice),
            csvEscape(formatNumber(row.eleitores)),
            csvEscape(formatNumber(row.votos_validos)),
            csvEscape(formatNumber(row.total_votos)),
        ]);

        const csv = [header.join(","), ...body.map((line) => line.join(","))].join("\n");
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `relatorio-cidades-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
    };

    const handleExportPDF = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-6">
            <div className="max-w-7xl mx-auto space-y-4">
                <header className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 print:border-0 print:shadow-none">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Relatórios de Cidades</h1>
                            <p className="text-sm text-slate-500 mt-1">Relatório filtrável com exportação em CSV e PDF</p>
                        </div>
                        <div className="flex items-center gap-2 print:hidden">
                            <button
                                type="button"
                                onClick={handleExportCSV}
                                disabled={rows.length === 0}
                                className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Exportar CSV
                            </button>
                            <button
                                type="button"
                                onClick={handleExportPDF}
                                disabled={rows.length === 0}
                                className="px-3 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                Exportar PDF
                            </button>
                            <Link
                                href="/app/admin"
                                className="px-3 py-2 text-sm rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                            >
                                Voltar
                            </Link>
                        </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-500">
                        {count} resultado(s) • Gerado em {new Date(generatedAt).toLocaleString("pt-BR")}
                    </div>
                </header>

                <RelatorioCidadesFiltros
                    value={filtros}
                    mesorregioes={mesorregioes}
                    statusOptions={statusOptions}
                    loading={loading}
                    onChange={handleFiltroChange}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                />

                {error ? (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">{error}</div>
                ) : (
                    <RelatorioCidadesTable rows={rows} loading={loading} />
                )}

                <section className="hidden print:block">
                    <h2 className="text-lg font-bold mb-2">Relatório de Cidades</h2>
                    <p className="text-sm mb-4">Gerado em {new Date(generatedAt).toLocaleString("pt-BR")}</p>
                    <table className="w-full border-collapse text-xs">
                        <thead>
                            <tr>
                                <th className="border border-slate-400 p-1 text-left">Cidade</th>
                                <th className="border border-slate-400 p-1 text-left">Mesorregião</th>
                                <th className="border border-slate-400 p-1 text-left">Prefeito</th>
                                <th className="border border-slate-400 p-1 text-left">Partido</th>
                                <th className="border border-slate-400 p-1 text-left">Status Prefeito</th>
                                <th className="border border-slate-400 p-1 text-left">Status Vice</th>
                                <th className="border border-slate-400 p-1 text-right">Eleitores</th>
                                <th className="border border-slate-400 p-1 text-right">Votos Válidos</th>
                                <th className="border border-slate-400 p-1 text-right">Total Votos</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.id}>
                                    <td className="border border-slate-300 p-1">{row.name}</td>
                                    <td className="border border-slate-300 p-1">{row.mesorregiao || "—"}</td>
                                    <td className="border border-slate-300 p-1">{row.prefeito || "—"}</td>
                                    <td className="border border-slate-300 p-1">{row.partido || "—"}</td>
                                    <td className="border border-slate-300 p-1">{row.status_prefeito || "—"}</td>
                                    <td className="border border-slate-300 p-1">{row.status_vice || "—"}</td>
                                    <td className="border border-slate-300 p-1 text-right">
                                        {row.eleitores?.toLocaleString("pt-BR") || "—"}
                                    </td>
                                    <td className="border border-slate-300 p-1 text-right">
                                        {row.votos_validos?.toLocaleString("pt-BR") || "—"}
                                    </td>
                                    <td className="border border-slate-300 p-1 text-right">
                                        {row.total_votos?.toLocaleString("pt-BR") || "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            </div>
        </div>
    );
}
