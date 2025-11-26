interface Vereador {
    nome: string;
    partido: string;
}

interface Cidade {
    name: string; // GeoJSON usa 'name'
    mesorregiao?: string;
    prefeito?: string;
    partido?: string;
    status_prefeito?: string;
    vice_prefeito?: string;
    status_vice?: string;
    apoio?: number;
    nao_apoio?: number;
    vereadores?: Vereador[];
}

export default function PainelCidade({ cidade }: { cidade: Cidade }) {
    const totalVereadores = (cidade.apoio || 0) + (cidade.nao_apoio || 0);
    const percentualApoio = totalVereadores > 0 ? Math.round(((cidade.apoio || 0) / totalVereadores) * 100) : 0;

    return (
        <div className="p-6 space-y-6">
            {/* Cabeçalho */}
            <header className="border-b border-gray-200 pb-4">
                <h2 className="text-2xl font-bold text-gray-800">{cidade.name}</h2>
                {cidade.mesorregiao && (
                    <p className="text-sm text-gray-500 uppercase tracking-wide mt-1">
                        📍 {cidade.mesorregiao}
                    </p>
                )}
            </header>

            {/* Seção do Executivo */}
            <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Poder Executivo
                </h3>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200">
                    {/* Prefeito */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Prefeito(a)</p>
                            <p className="text-lg font-semibold text-gray-900 mt-0.5">
                                {cidade.prefeito || "Não informado"}
                            </p>
                            {cidade.status_prefeito && (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full mt-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    {cidade.status_prefeito}
                                </span>
                            )}
                        </div>
                        {cidade.partido && (
                            <span className="bg-blue-600 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-sm">
                                {cidade.partido}
                            </span>
                        )}
                    </div>

                    {/* Vice-Prefeito */}
                    {cidade.vice_prefeito && (
                        <div className="pt-3 border-t border-blue-200/60">
                            <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Vice-Prefeito(a)</p>
                            <p className="font-medium text-gray-800 mt-0.5">{cidade.vice_prefeito}</p>
                            {cidade.status_vice && (
                                <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full mt-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                    {cidade.status_vice}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Seção de Composição da Câmara */}
            <section>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    Composição da Câmara
                </h3>

                {/* Barra de Progresso */}
                {totalVereadores > 0 && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                            <span>Base de Apoio ({percentualApoio}%)</span>
                            <span>{totalVereadores} vereadores</span>
                        </div>
                        <div className="h-3 bg-red-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all duration-500"
                                style={{ width: `${percentualApoio}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Cards de Apoio */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-green-50 to-green-100/50 p-4 rounded-xl border border-green-200 text-center">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-white text-lg">👍</span>
                        </div>
                        <p className="text-2xl font-bold text-green-700">{cidade.apoio || 0}</p>
                        <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Base Aliada</p>
                    </div>
                    <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-4 rounded-xl border border-red-200 text-center">
                        <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-white text-lg">👎</span>
                        </div>
                        <p className="text-2xl font-bold text-red-700">{cidade.nao_apoio || 0}</p>
                        <p className="text-xs text-red-600 font-medium uppercase tracking-wide">Oposição</p>
                    </div>
                </div>
            </section>

            {/* Lista de Vereadores */}
            {cidade.vereadores && cidade.vereadores.length > 0 && (
                <section>
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-amber-500 rounded-full"></span>
                        Vereadores ({cidade.vereadores.length})
                    </h3>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                            {cidade.vereadores.map((ver, idx) => (
                                <div
                                    key={idx}
                                    className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-sm font-medium">
                                            {idx + 1}
                                        </div>
                                        <span className="font-medium text-gray-700">{ver.nome}</span>
                                    </div>
                                    <span className="text-xs font-bold bg-gray-800 text-white px-2.5 py-1 rounded-md">
                                        {ver.partido}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
