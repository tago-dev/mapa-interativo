"use client";

import { useState, useRef, useCallback } from "react";
import { Vereador } from "@/types/types";

interface VereadorCSV {
    cidade_id: string;
    nome: string;
    partido?: string;
    posicao?: "aliado" | "neutro" | "oposicao";
}

interface CSVVereadoresModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (vereadores: Omit<Vereador, 'id' | 'created_at'>[]) => Promise<void>;
}

// Mapeamento de colunas do CSV para campos do Vereador
const CSV_COLUMN_MAP: Record<string, keyof VereadorCSV> = {
    // Cidade ID (ID da cidade onde o vereador atua)
    'cidade_id': 'cidade_id',
    'id_cidade': 'cidade_id',
    'cod_cidade': 'cidade_id',
    'codigo_cidade': 'cidade_id',
    'municipio_id': 'cidade_id',
    'cod_municipio': 'cidade_id',
    'codigo_municipio': 'cidade_id',
    // Nome do vereador
    'nome': 'nome',
    'name': 'nome',
    'vereador': 'nome',
    'nome_vereador': 'nome',
    // Partido
    'partido': 'partido',
    'sigla_partido': 'partido',
    'sigla': 'partido',
    // Posição
    'posicao': 'posicao',
    'posição': 'posicao',
    'status': 'posicao',
    'alinhamento': 'posicao',
};

const normalizePosicao = (raw: string): "aliado" | "neutro" | "oposicao" => {
    const value = raw
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();

    if (value === "aliado") return "aliado";
    if (value === "oposicao") return "oposicao";
    return "neutro";
};

export default function CSVVereadoresModal({ isOpen, onClose, onImport }: CSVVereadoresModalProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'success'>('upload');
    const [parsedData, setParsedData] = useState<VereadorCSV[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [importStats, setImportStats] = useState({ total: 0, cidades: 0 });
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetModal = useCallback(() => {
        setStep('upload');
        setParsedData([]);
        setErrors([]);
        setFileName('');
        setImportStats({ total: 0, cidades: 0 });
    }, []);

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
        const lines = text.split(/\r?\n/).filter(line => line.trim());
        if (lines.length === 0) return { headers: [], rows: [] };

        // Detecta o separador (vírgula ou ponto-e-vírgula)
        const firstLine = lines[0];
        const separator = firstLine.includes(';') ? ';' : ',';

        const parseRow = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === separator && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };

        const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/['"]/g, '').trim());
        const rows = lines.slice(1).map(parseRow);

        return { headers, rows };
    };

    const mapCSVToVereador = (headers: string[], row: string[]): VereadorCSV | null => {
        const vereador: Partial<VereadorCSV> = {};

        headers.forEach((header, index) => {
            const field = CSV_COLUMN_MAP[header];
            if (field) {
                const rawValue = row[index];

                if (rawValue === undefined || rawValue === null || rawValue === '') {
                    return;
                }

                const value = rawValue.replace(/^["']|["']$/g, '').trim();

                if (!value) return;

                if (field === "posicao") {
                    vereador[field] = normalizePosicao(value);
                } else {
                    vereador[field] = value;
                }
            }
        });

        // Validação: cidade_id e nome são obrigatórios
        if (!vereador.cidade_id || !vereador.nome) {
            return null;
        }

        return vereador as VereadorCSV;
    };

    const processFile = (file: File) => {
        setFileName(file.name);
        setErrors([]);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const { headers, rows } = parseCSV(text);

                if (headers.length === 0) {
                    setErrors(['Arquivo CSV vazio ou inválido']);
                    return;
                }

                // Verifica se tem as colunas necessárias
                const hasCidadeId = headers.some(h => ['cidade_id', 'id_cidade', 'cod_cidade', 'codigo_cidade', 'municipio_id', 'id'].includes(h));
                const hasNome = headers.some(h => ['nome', 'name', 'vereador', 'nome_vereador'].includes(h));

                if (!hasCidadeId) {
                    setErrors(['O CSV precisa ter uma coluna para o ID da cidade (cidade_id, id_cidade, etc.)']);
                    return;
                }

                if (!hasNome) {
                    setErrors(['O CSV precisa ter uma coluna para o nome do vereador (nome, vereador, etc.)']);
                    return;
                }

                const vereadores: VereadorCSV[] = [];
                const parseErrors: string[] = [];

                rows.forEach((row, index) => {
                    if (row.every(cell => !cell.trim())) return;

                    const vereador = mapCSVToVereador(headers, row);
                    if (vereador) {
                        vereadores.push(vereador);
                    } else {
                        parseErrors.push(`Linha ${index + 2}: dados incompletos (cidade_id ou nome faltando)`);
                    }
                });

                if (parseErrors.length > 0 && parseErrors.length <= 5) {
                    setErrors(parseErrors);
                } else if (parseErrors.length > 5) {
                    setErrors([...parseErrors.slice(0, 5), `... e mais ${parseErrors.length - 5} erros`]);
                }

                if (vereadores.length > 0) {
                    setParsedData(vereadores);

                    // Calcula estatísticas
                    const cidadesSet = new Set(vereadores.map(v => v.cidade_id));
                    setImportStats({
                        total: vereadores.length,
                        cidades: cidadesSet.size
                    });

                    setStep('preview');
                } else {
                    setErrors(['Nenhum dado válido encontrado no CSV']);
                }
            } catch (err) {
                setErrors(['Erro ao processar arquivo CSV']);
                console.error(err);
            }
        };

        reader.readAsText(file, 'UTF-8');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        const file = e.dataTransfer.files?.[0];
        if (file && file.name.endsWith('.csv')) {
            processFile(file);
        } else {
            setErrors(['Por favor, envie um arquivo CSV válido']);
        }
    };

    const handleImport = async () => {
        setStep('importing');
        setErrors([]);
        try {
            await onImport(parsedData);
            setStep('success');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
            console.error('Erro ao importar:', err);
            setErrors([`Erro ao importar dados: ${errorMessage}`]);
            setStep('preview');
        }
    };

    const downloadTemplate = () => {
        const headers = ['cidade_id', 'nome', 'partido', 'posicao'];
        const exampleRows = [
            ['4100103', 'João Silva', 'PSD', 'aliado'],
            ['4100103', 'Maria Santos', 'MDB', 'neutro'],
            ['4100202', 'Pedro Oliveira', 'PP', 'oposicao'],
        ];

        const csvContent = [headers.join(';'), ...exampleRows.map(r => r.join(';'))].join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'modelo_vereadores.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    // Agrupa vereadores por cidade para preview
    const groupedByCity = parsedData.reduce((acc, v) => {
        if (!acc[v.cidade_id]) acc[v.cidade_id] = [];
        acc[v.cidade_id].push(v);
        return acc;
    }, {} as Record<string, VereadorCSV[]>);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden mx-4">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">Importar Vereadores (CSV)</h2>
                        <p className="text-sm text-slate-500">Importe vereadores de todas as cidades em massa</p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Step: Upload */}
                    {step === 'upload' && (
                        <div className="space-y-6">
                            {/* Info */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="font-medium text-blue-800">Total esperado: 3.882 vereadores</p>
                                        <p className="text-sm text-blue-700 mt-1">
                                            O CSV deve conter o ID da cidade, nome do vereador e opcionalmente o partido.
                                            Os vereadores serão distribuídos automaticamente para suas respectivas cidades.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Drag & Drop Zone */}
                            <div
                                onDragEnter={handleDrag}
                                onDragLeave={handleDrag}
                                onDragOver={handleDrag}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${dragActive
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                                    }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <p className="text-slate-600 font-medium">
                                    Arraste um arquivo CSV aqui ou clique para selecionar
                                </p>
                                <p className="text-sm text-slate-400 mt-2">
                                    Suporta arquivos .csv com separador vírgula ou ponto-e-vírgula
                                </p>
                            </div>

                            {/* Erros */}
                            {errors.length > 0 && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <div>
                                            {errors.map((error, i) => (
                                                <p key={i} className="text-sm text-red-700">{error}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Modelo de CSV */}
                            <div className="bg-slate-50 rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium text-slate-700">Modelo de CSV</h4>
                                        <p className="text-sm text-slate-500 mt-1">
                                            Baixe o modelo com as colunas corretas
                                        </p>
                                    </div>
                                    <button
                                        onClick={downloadTemplate}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Baixar Modelo
                                    </button>
                                </div>
                            </div>

                            {/* Colunas aceitas */}
                            <div>
                                <h4 className="font-medium text-slate-700 mb-3">Colunas aceitas:</h4>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <code className="px-2 py-0.5 bg-slate-100 rounded text-xs">cidade_id</code>
                                        <span className="text-slate-400">→</span>
                                        <span>ID da Cidade (obrigatório)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <code className="px-2 py-0.5 bg-slate-100 rounded text-xs">nome</code>
                                        <span className="text-slate-400">→</span>
                                        <span>Nome do Vereador (obrigatório)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <code className="px-2 py-0.5 bg-slate-100 rounded text-xs">partido</code>
                                        <span className="text-slate-400">→</span>
                                        <span>Partido (opcional)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <code className="px-2 py-0.5 bg-slate-100 rounded text-xs">posicao</code>
                                        <span className="text-slate-400">→</span>
                                        <span>aliado/neutro/oposicao (opcional)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step: Preview */}
                    {step === 'preview' && (
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1 bg-slate-50 rounded-lg p-4">
                                    <p className="text-sm text-slate-500">Arquivo</p>
                                    <p className="font-medium text-slate-800 truncate">{fileName}</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-purple-600">{importStats.total}</p>
                                    <p className="text-xs text-purple-600">vereadores</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-600">{importStats.cidades}</p>
                                    <p className="text-xs text-blue-600">cidades</p>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-emerald-600">
                                        {(importStats.total / importStats.cidades).toFixed(1)}
                                    </p>
                                    <p className="text-xs text-emerald-600">média/cidade</p>
                                </div>
                            </div>

                            {/* Erros */}
                            {errors.length > 0 && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div>
                                            <p className="font-medium text-amber-800">Alguns registros foram ignorados:</p>
                                            {errors.map((error, i) => (
                                                <p key={i} className="text-sm text-amber-700">{error}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Preview por cidade */}
                            <div>
                                <h4 className="font-medium text-slate-700 mb-3">
                                    Preview (primeiras 5 cidades):
                                </h4>
                                <div className="space-y-3">
                                    {Object.entries(groupedByCity).slice(0, 5).map(([cidadeId, vereadores]) => (
                                        <div key={cidadeId} className="border border-slate-200 rounded-lg overflow-hidden">
                                            <div className="bg-slate-50 px-4 py-2 flex items-center justify-between">
                                                <span className="font-medium text-slate-700">
                                                    Cidade ID: <code className="text-blue-600">{cidadeId}</code>
                                                </span>
                                                <span className="text-sm text-slate-500">
                                                    {vereadores.length} vereador{vereadores.length > 1 ? 'es' : ''}
                                                </span>
                                            </div>
                                            <div className="px-4 py-2">
                                                <div className="flex flex-wrap gap-2">
                                                    {vereadores.slice(0, 5).map((v, i) => (
                                                        <span
                                                            key={i}
                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm"
                                                        >
                                                            <span className="text-slate-800">{v.nome}</span>
                                                            {v.partido && (
                                                                <span className="text-slate-500">({v.partido})</span>
                                                            )}
                                                        </span>
                                                    ))}
                                                    {vereadores.length > 5 && (
                                                        <span className="text-sm text-slate-400">
                                                            +{vereadores.length - 5} mais
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {Object.keys(groupedByCity).length > 5 && (
                                        <p className="text-center text-sm text-slate-500">
                                            ... e mais {Object.keys(groupedByCity).length - 5} cidades
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step: Importing */}
                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-3 border-slate-200 border-t-purple-500 rounded-full animate-spin mb-6"></div>
                            <p className="text-lg font-medium text-slate-800">Importando vereadores...</p>
                            <p className="text-sm text-slate-500 mt-2">
                                Aguarde enquanto processamos {parsedData.length} registros
                            </p>
                        </div>
                    )}

                    {/* Step: Success */}
                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-lg font-medium text-slate-800">Importação concluída!</p>
                            <p className="text-sm text-slate-500 mt-2">
                                {parsedData.length} vereadores foram importados para {importStats.cidades} cidades
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
                    {step === 'upload' && (
                        <button
                            onClick={handleClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                        >
                            Cancelar
                        </button>
                    )}

                    {step === 'preview' && (
                        <>
                            <button
                                onClick={resetModal}
                                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                ← Voltar
                            </button>
                            <button
                                onClick={handleImport}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Importar {parsedData.length} vereadores
                            </button>
                        </>
                    )}

                    {step === 'success' && (
                        <button
                            onClick={handleClose}
                            className="ml-auto px-6 py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-900 transition-colors"
                        >
                            Fechar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
