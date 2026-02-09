"use client";

import { useState, useRef, useCallback } from "react";
import { Cidade } from "@/types/types";

interface ParsedVotosValidosData {
    nomePrefeito: string;
    cidadeId?: string;
    cidadeNome?: string;
    votosValidos: number;
}

interface CSVVotosValidosImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (cities: Partial<Cidade>[]) => Promise<void>;
    existingCities: { id: string; name: string; prefeito?: string }[];
}

// Função para normalizar nomes (remover acentos e converter para minúsculo)
function normalizeName(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim();
}

export default function CSVVotosValidosImportModal({
    isOpen,
    onClose,
    onImport,
    existingCities,
}: CSVVotosValidosImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<ParsedVotosValidosData[]>([]);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [matchStats, setMatchStats] = useState<{ matched: number; notMatched: string[] }>({ matched: 0, notMatched: [] });
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Criar mapa de nomes de prefeitos normalizados para IDs de cidades
    const prefeitoToCity = useCallback(() => {
        const map = new Map<string, { id: string; name: string }>();
        existingCities.forEach(city => {
            if (city.prefeito) {
                map.set(normalizeName(city.prefeito), { id: city.id, name: city.name });
            }
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

                // Detectar separador (vírgula, ponto e vírgula ou tab)
                const firstLine = lines[0];
                let separator = ",";
                if (firstLine.includes(";")) separator = ";";
                else if (firstLine.includes("\t")) separator = "\t";

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

                // Detectar colunas pelo header
                const headerValues = parseCSVLine(lines[0]);
                let nomeCol = 0;
                let votosCol = 1;

                // Tentar identificar colunas pelo nome
                headerValues.forEach((val, idx) => {
                    const normalVal = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                    if (normalVal.includes("prefeito") || normalVal.includes("nome")) {
                        nomeCol = idx;
                    }
                    if (normalVal.includes("votos") || normalVal.includes("validos") || normalVal.includes("votos_validos")) {
                        votosCol = idx;
                    }
                });

                const prefeitoMap = prefeitoToCity();
                const data: ParsedVotosValidosData[] = [];
                const notMatchedPrefeitos: string[] = [];
                let matchedCount = 0;

                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i]);
                    if (values.length < 2) continue;

                    const nomePrefeito = values[nomeCol]?.trim() || "";
                    if (!nomePrefeito) continue;

                    const votosValidos = parseInt(values[votosCol]?.replace(/\D/g, "") || "0", 10);

                    const normalizedPrefeito = normalizeName(nomePrefeito);
                    const cityMatch = prefeitoMap.get(normalizedPrefeito);

                    if (cityMatch) {
                        matchedCount++;
                        data.push({
                            nomePrefeito,
                            cidadeId: cityMatch.id,
                            cidadeNome: cityMatch.name,
                            votosValidos,
                        });
                    } else {
                        notMatchedPrefeitos.push(nomePrefeito);
                        data.push({
                            nomePrefeito,
                            votosValidos,
                        });
                    }
                }

                setParsedData(data);
                setMatchStats({ matched: matchedCount, notMatched: notMatchedPrefeitos });
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
    }, [prefeitoToCity]);

    const handleImport = async () => {
        if (parsedData.length === 0) return;

        setImporting(true);
        setError(null);

        try {
            // Filtrar apenas cidades que foram encontradas
            const matchedData = parsedData.filter(d => d.cidadeId);

            // Preparar dados das cidades
            const cities: Partial<Cidade>[] = matchedData.map(d => ({
                id: d.cidadeId!,
                votos_validos: d.votosValidos,
            }));

            await onImport(cities);

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

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Importar Votos Válidos
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Match por nome do prefeito
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
                            <strong>Formato esperado:</strong> CSV com colunas <code className="bg-blue-100 px-1 rounded">nome_prefeito</code> e <code className="bg-blue-100 px-1 rounded">votos_validos</code>.
                            O sistema faz match pelo nome do prefeito já cadastrado.
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
                            <p className="text-slate-500 text-sm mt-1">nome_prefeito, votos_validos</p>
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
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-slate-50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-slate-800">{parsedData.length}</p>
                                    <p className="text-xs text-slate-500">Linhas no CSV</p>
                                </div>
                                <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-green-600">{matchStats.matched}</p>
                                    <p className="text-xs text-green-700">Prefeitos Encontrados</p>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-3 text-center">
                                    <p className="text-2xl font-bold text-amber-600">{matchStats.notMatched.length}</p>
                                    <p className="text-xs text-amber-700">Não Encontrados</p>
                                </div>
                            </div>

                            {/* Prefeitos não encontrados */}
                            {matchStats.notMatched.length > 0 && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-sm font-medium text-amber-800 mb-2">
                                        ⚠️ Prefeitos não encontrados ({matchStats.notMatched.length}):
                                    </p>
                                    <p className="text-xs text-amber-700 max-h-20 overflow-y-auto">
                                        {matchStats.notMatched.slice(0, 10).join(", ")}
                                        {matchStats.notMatched.length > 10 && ` ... e mais ${matchStats.notMatched.length - 10}`}
                                    </p>
                                </div>
                            )}

                            {/* Preview da tabela */}
                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
                                    <p className="text-sm font-medium text-slate-700">Preview (primeiros 15)</p>
                                </div>
                                <div className="overflow-x-auto max-h-64">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
                                                <th className="px-3 py-2 text-left font-medium text-slate-600">Prefeito</th>
                                                <th className="px-3 py-2 text-left font-medium text-slate-600">Cidade</th>
                                                <th className="px-3 py-2 text-right font-medium text-slate-600">Votos Válidos</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedData.slice(0, 15).map((d, i) => (
                                                <tr key={i} className={`border-b border-slate-100 ${d.cidadeId ? '' : 'bg-amber-50'}`}>
                                                    <td className="px-3 py-2">
                                                        {d.cidadeId ? (
                                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                                OK
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-600">❌</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-2 text-slate-800">{d.nomePrefeito}</td>
                                                    <td className="px-3 py-2 text-slate-600">{d.cidadeNome || "-"}</td>
                                                    <td className="px-3 py-2 text-slate-600 text-right font-mono">
                                                        {d.votosValidos.toLocaleString("pt-BR")}
                                                    </td>
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
                            <>Serão atualizados {matchStats.matched} registros</>
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
                            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
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
                                <>Importar Votos Válidos</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
