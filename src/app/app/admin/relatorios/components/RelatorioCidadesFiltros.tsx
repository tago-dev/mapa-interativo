"use client";

type RelatorioCidadesFiltrosValue = {
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

type Props = {
    value: RelatorioCidadesFiltrosValue;
    mesorregioes: string[];
    statusOptions: string[];
    loading: boolean;
    onChange: <K extends keyof RelatorioCidadesFiltrosValue>(
        field: K,
        fieldValue: RelatorioCidadesFiltrosValue[K]
    ) => void;
    onApply: () => void;
    onClear: () => void;
};

export default function RelatorioCidadesFiltros({
    value,
    mesorregioes,
    statusOptions,
    loading,
    onChange,
    onApply,
    onClear,
}: Props) {
    return (
        <section className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 print:hidden">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Filtros</h2>
                <button
                    type="button"
                    onClick={onClear}
                    disabled={loading}
                    className="text-xs text-slate-500 hover:text-slate-700 disabled:opacity-50"
                >
                    Limpar filtros
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                <input
                    type="text"
                    placeholder="Buscar cidade..."
                    value={value.search}
                    onChange={(e) => onChange("search", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                />

                <select
                    value={value.mesorregiao}
                    onChange={(e) => onChange("mesorregiao", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none bg-white"
                >
                    <option value="all">Mesorregião: Todas</option>
                    {mesorregioes.map((mesorregiao) => (
                        <option key={mesorregiao} value={mesorregiao}>
                            {mesorregiao}
                        </option>
                    ))}
                </select>

                <select
                    value={value.statusPrefeito}
                    onChange={(e) => onChange("statusPrefeito", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none bg-white"
                >
                    <option value="all">Status prefeito: Todos</option>
                    {statusOptions.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>

                <select
                    value={value.statusVice}
                    onChange={(e) => onChange("statusVice", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none bg-white"
                >
                    <option value="all">Status vice: Todos</option>
                    {statusOptions.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                </select>

                <input
                    type="number"
                    placeholder="Eleitores min"
                    value={value.eleitoresMin}
                    onChange={(e) => onChange("eleitoresMin", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                />
                <input
                    type="number"
                    placeholder="Eleitores max"
                    value={value.eleitoresMax}
                    onChange={(e) => onChange("eleitoresMax", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                />

                <input
                    type="number"
                    placeholder="Votos válidos min"
                    value={value.votosValidosMin}
                    onChange={(e) => onChange("votosValidosMin", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                />
                <input
                    type="number"
                    placeholder="Votos válidos max"
                    value={value.votosValidosMax}
                    onChange={(e) => onChange("votosValidosMax", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                />

                <input
                    type="number"
                    placeholder="Total votos min"
                    value={value.totalVotosMin}
                    onChange={(e) => onChange("totalVotosMin", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                />
                <input
                    type="number"
                    placeholder="Total votos max"
                    value={value.totalVotosMax}
                    onChange={(e) => onChange("totalVotosMax", e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-400 outline-none"
                />
            </div>

            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={onApply}
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {loading ? "Aplicando..." : "Aplicar filtros"}
                </button>
            </div>
        </section>
    );
}
