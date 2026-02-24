"use client";

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

type Props = {
    rows: RelatorioCidade[];
    loading: boolean;
};

const formatNumber = (value: number | null) =>
    value === null || value === undefined ? "—" : value.toLocaleString("pt-BR");

export default function RelatorioCidadesTable({ rows, loading }: Props) {
    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
                Carregando relatório...
            </div>
        );
    }

    if (rows.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
                <p className="text-slate-600 font-medium">Nenhum resultado encontrado</p>
                <p className="text-slate-400 text-sm mt-1">Ajuste os filtros para ampliar a busca.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Cidade</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Mesorregião</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Prefeito</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Partido</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status Prefeito</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Status Vice</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Eleitores</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Votos Válidos</th>
                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">Total Votos</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {rows.map((row) => (
                            <tr key={row.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-sm font-medium text-slate-800">{row.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{row.mesorregiao || "—"}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{row.prefeito || "—"}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{row.partido || "—"}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{row.status_prefeito || "—"}</td>
                                <td className="px-4 py-3 text-sm text-slate-600">{row.status_vice || "—"}</td>
                                <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatNumber(row.eleitores)}</td>
                                <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatNumber(row.votos_validos)}</td>
                                <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatNumber(row.total_votos)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
