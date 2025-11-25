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
    return (
        <div className="p-6">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800">{cidade.name}</h2>
                {cidade.mesorregiao && (
                    <p className="text-sm text-gray-500 uppercase tracking-wide mt-1">{cidade.mesorregiao}</p>
                )}
            </div>

            <div className="space-y-6">
                {/* Seção do Executivo */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h3 className="text-lg font-semibold text-blue-800 mb-3 border-b border-blue-200 pb-2">Executivo</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Prefeito</p>
                            <p className="font-medium text-gray-900">{cidade.prefeito || "Não informado"}</p>
                            {cidade.status_prefeito && (
                                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded mt-1">
                                    {cidade.status_prefeito}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Partido</p>
                            <p className="font-bold text-blue-600">{cidade.partido || "-"}</p>
                        </div>
                        {cidade.vice_prefeito && (
                            <div className="col-span-2 mt-2 pt-2 border-t border-blue-100">
                                <p className="text-xs text-gray-500">Vice-Prefeito</p>
                                <p className="font-medium text-gray-900">{cidade.vice_prefeito}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Seção de Apoio */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
                        <p className="text-xs text-green-600 font-semibold uppercase">Base de Apoio</p>
                        <p className="text-3xl font-bold text-green-700">{cidade.apoio || 0}</p>
                        <p className="text-xs text-gray-500">Vereadores</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100 text-center">
                        <p className="text-xs text-red-600 font-semibold uppercase">Oposição/Neutros</p>
                        <p className="text-3xl font-bold text-red-700">{cidade.nao_apoio || 0}</p>
                        <p className="text-xs text-gray-500">Vereadores</p>
                    </div>
                </div>

                {/* Lista de Vereadores */}
                {cidade.vereadores && cidade.vereadores.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Câmara Municipal</h3>
                        <div className="bg-white border rounded-lg divide-y">
                            {cidade.vereadores.map((ver, idx) => (
                                <div key={idx} className="p-3 flex justify-between items-center hover:bg-gray-50">
                                    <span className="font-medium text-gray-700">{ver.nome}</span>
                                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        {ver.partido}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
