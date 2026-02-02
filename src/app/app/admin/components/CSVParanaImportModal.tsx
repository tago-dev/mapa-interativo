"use client";

import { useState, useRef, useCallback } from "react";
import { Cidade, Vereador } from "@/types/types";

interface ParsedParanaData {
    cidadeNome: string;
    cidadeId?: string;
    prefeito: string;
    partido: string;
    vicePrefeito: string;
    partidoVice: string;
    totalVotos: number;
    votosPrefeito: number;
    vereadores: { nome: string; partido: string }[];
}

interface CSVParanaImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (
        cities: Partial<Cidade>[],
        vereadores: Omit<Vereador, 'id' | 'created_at'>[]
    ) => Promise<void>;
    existingCities: { id: string; name: string }[];
}

// Função para normalizar nomes de cidades (remover acentos e converter para minúsculo)
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
}

// Função para fazer o parse dos vereadores
function parseVereadores(vereadoresStr: string): { nome: string; partido: string }[] {
    if (!vereadoresStr || vereadoresStr.trim() === "") return [];

    // Formato: "NOME/PARTIDO, NOME2/PARTIDO2, ..."
    return vereadoresStr.split(",").map(v => {
        const parts = v.trim().split("/");
        const nome = parts[0]?.trim() || "";
        const partido = parts[1]?.trim() || "";
        return { nome, partido };
    }).filter(v => v.nome !== "");
}

export default function CSVParanaImportModal({
    isOpen,
    onClose,
    onImport,
    existingCities,
}: CSVParanaImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedParanaData[]>([]);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matchStats, setMatchStats] = useState<{ matched: number; notMatched: string[] }>({ matched: 0, notMatched: [] });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Criar mapa de nomes normalizados para IDs
    const cityNameToId = useCallback(() => {
        const map = new Map<string, string>();
        existingCities.forEach(city => {
            map.set(normalizeName(city.name), city.id);
        });
        return map;
    }, [existingCities]);

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const lines = text.split("\n").filter(line => line.trim() !== "");

                if (lines.length < 2) {
                    setError("O arquivo está vazio ou não tem dados válidos.");
                    return;
                }

                // Detectar separador (vírgula ou ponto e vírgula)
                const firstLine = lines[0];
                const separator = firstLine.includes(";") ? ";" : ",";

                // Parse do CSV considerando aspas
                const parseCSVLine = (line: string): string[] => {
                    const result: string[] = [];
                    let current = "";
                    let inQuotes = false;

                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        if (char === '"') {
                            inQuotes = !inQuotes;
                        } else if (char === separator && !inQuotes) {
                            result.push(current.trim().replace(/^"|"$/g, ""));
                            current = "";
                        } else {
                            current += char;
                        }
                    }
                    result.push(current.trim().replace(/^"|"$/g, ""));
                    return result;
                };

                // Pular header
                const nameMap = cityNameToId();
                const data: ParsedParanaData[] = [];
                const notMatchedCities: string[] = [];
                let matchedCount = 0;

                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i]);
                    if (values.length < 7) continue;

                    const cidadeNome = values[0]?.trim() || "";
                    const normalizedName = normalizeName(cidadeNome);
                    const cidadeId = nameMap.get(normalizedName);

                    if (cidadeId) {
                        matchedCount++;
                    } else {
                        notMatchedCities.push(cidadeNome);
                    }

                    const prefeito = values[1]?.trim() || "";
                    const partido = values[2]?.trim() || "";
                    const vicePrefeito = values[3]?.trim() || "";
                    const partidoVice = values[4]?.trim() || "";
                    const totalVotos = parseInt(values[5]?.replace(/\D/g, "") || "0", 10);
                    const votosPrefeito = parseInt(values[6]?.replace(/\D/g, "") || "0", 10);
                    const vereadoresStr = values[7] || "";

                    data.push({
                        cidadeNome,
                        cidadeId,
                        prefeito,
                        partido,
                        vicePrefeito,
                        partidoVice,
                        totalVotos,
                        votosPrefeito,
                        vereadores: parseVereadores(vereadoresStr),
                    });
                }

                setParsedData(data);
                setMatchStats({ matched: matchedCount, notMatched: notMatchedCities });
            } catch (err) {
                console.error("Erro ao parsear CSV:", err);
                setError("Erro ao processar o arquivo CSV. Verifique o formato.");
            }
        };
        reader.readAsText(selectedFile);
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && (droppedFile.name.endsWith(".csv") || droppedFile.type === "text/csv")) {
            handleFileSelect(droppedFile);
        } else {
            setError("Por favor, envie um arquivo CSV válido.");
        }
    }, [cityNameToId]);

    const handleImport = async () => {
        if (parsedData.length === 0) return;

        setImporting(true);
        setError(null);

        try {
            // Filtrar apenas cidades que foram encontradas no banco
            const matchedData = parsedData.filter(d => d.cidadeId);

            // Preparar dados das cidades
            const cities: Partial<Cidade>[] = matchedData.map(d => ({
                id: d.cidadeId!,
                prefeito: d.prefeito || undefined,
                partido: d.partido || undefined,
                vice_prefeito: d.vicePrefeito || undefined,
                partido_vice: d.partidoVice || undefined,
                total_votos: d.totalVotos || undefined,
            }));

            // Preparar dados dos vereadores
            const vereadores: Omit<Vereador, 'id' | 'created_at'>[] = [];
            matchedData.forEach(d => {
                d.vereadores.forEach(v => {
                    vereadores.push({
                        cidade_id: d.cidadeId!,
                        nome: v.nome,
                        partido: v.partido || undefined,
                    });
                });
            });

            await onImport(cities, vereadores);

            // Limpar e fechar
            setFile(null);
            setParsedData([]);
            setMatchStats({ matched: 0, notMatched: [] });
            onClose();
        } catch (err) {
            console.error("Erro ao importar:", err);
            setError(err instanceof Error ? err.message : "Erro ao importar dados.");
        } finally {
            setImporting(false);
        }
    };

    const handleClose = () => {
        setFile(null);
        setParsedData([]);
        setError(null);
        setMatchStats({ matched: 0, notMatched: [] });
        onClose();
    };

    if (!isOpen) return null;

    const totalVereadores = parsedData.reduce((acc, d) => acc + d.vereadores.length, 0);
    const matchedVereadores = parsedData
        .filter(d => d.cidadeId)
        .reduce((acc, d) => acc + d.vereadores.length, 0);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Importar CSV do Paraná
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Importa prefeitos, vices, votos e vereadores de uma vez
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Info sobre o formato */}
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                            <strong>Formato esperado:</strong> nome do municipio, nome do prefeito, partido prefeito,
                            nome do vice, partido do vice, numero de votos total do municipio, votos do prefeito eleito,
                            vereadores eleitos (NOME/PARTIDO, NOME2/PARTIDO2, ...)
                        </p>
                    </div>

                    {/* Dropzone */}
                    {!file && (
                        <div
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-slate-600 font-medium">Arraste o arquivo CSV ou clique para selecionar</p>
                            <p className="text-slate-500 text-sm mt-1">parana.csv</p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,text/csv"
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Erro */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Resultado do parse */}
                    {file && parsedData.length > 0 && (
                        <div className="mt-4 space-y-4">
                            {/* Stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="bg-slate-50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-slate-800">{parsedData.length}</p>
                                    <p className="text-xs text-slate-500">Cidades no CSV</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-green-600">{matchStats.matched}</p>
                                    <p className="text-xs text-green-700">Cidades Encontradas</p>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-amber-600">{matchStats.notMatched.length}</p>
                                    <p className="text-xs text-amber-700">Não Encontradas</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-purple-600">{matchedVereadores}</p>
                                    <p className="text-xs text-purple-700">Vereadores</p>
                                </div>
                            </div>

                            {/* Cidades não encontradas */}
                            {matchStats.notMatched.length > 0 && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-sm font-medium text-amber-800 mb-2">
                                        ⚠️ Cidades não encontradas no banco ({matchStats.notMatched.length}):
                                    </p>
                                    <p className="text-xs text-amber-700 max-h-20 overflow-y-auto">
                                        {matchStats.notMatched.join(", ")}
                                    </p>
                                </div>
                            )}

                            {/* Preview da tabela */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                                    <p className="text-sm font-medium text-slate-700">Preview (primeiros 10)</p>
                                </div>
                                <div className="overflow-x-auto max-h-64">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-100 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600">Status</th>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600">Cidade</th>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600">Prefeito</th>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600">Partido</th>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600">Vice</th>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600">Votos</th>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600">Vereadores</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.slice(0, 10).map((d, i) => (
                                                <tr key={i} className={`border-b border-slate-100 ${d.cidadeId ? '' : 'bg-amber-50'}`}>
                                                    <td className="px-2 py-1.5">
                                                        {d.cidadeId ? (
                                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                                OK
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-600">❌</span>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-1.5 text-slate-800 font-medium">{d.cidadeNome}</td>
                                                    <td className="px-2 py-1.5 text-slate-600">{d.prefeito}</td>
                                                    <td className="px-2 py-1.5 text-slate-500">{d.partido}</td>
                                                    <td className="px-2 py-1.5 text-slate-600">{d.vicePrefeito}</td>
                                                    <td className="px-2 py-1.5 text-slate-500">{d.totalVotos.toLocaleString()}</td>
                                                    <td className="px-2 py-1.5 text-slate-500">{d.vereadores.length}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Trocar arquivo */}
                            <button
                                onClick={() => {
                                    setFile(null);
                                    setParsedData([]);
                                    setMatchStats({ matched: 0, notMatched: [] });
                                }}
                                className="text-sm text-slate-500 hover:text-slate-700 underline"
                            >
                                Escolher outro arquivo
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50">
                    <p className="text-xs text-slate-500">
                        {matchStats.matched > 0 && (
                            <>Serão atualizadas {matchStats.matched} cidades e inseridos {matchedVereadores} vereadores</>
                        )}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={importing || matchStats.matched === 0}
                            className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                        >
                            {importing ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Importando...
                                </>
                            ) : (
                                <>Importar Dados</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
