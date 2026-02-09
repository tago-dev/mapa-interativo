"use client";

import { useState, useRef, useCallback } from "react";
import { Cidade } from "@/types/types";

interface CSVUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (cities: Partial<Cidade>[]) => Promise<void>;
    existingCityIds: Set<string>;
}

// Mapeamento de colunas do CSV para campos da Cidade
const CSV_COLUMN_MAP: Record<string, keyof Cidade> = {
    // ID
    'id': 'id',
    'codigo': 'id',
    'cod_ibge': 'id',
    // Nome
    'name': 'name',
    'nome': 'name',
    'cidade': 'name',
    'municipio': 'name',
    'município': 'name',
    // Mesorregião
    'mesorregiao': 'mesorregiao',
    'mesorregião': 'mesorregiao',
    'regiao': 'mesorregiao',
    'região': 'mesorregiao',
    // Eleitores
    'eleitores': 'eleitores',
    'num_eleitores': 'eleitores',
    // Prefeito
    'prefeito': 'prefeito',
    'nome_prefeito': 'prefeito',
    // Partido
    'partido': 'partido',
    'partido_prefeito': 'partido',
    // Status prefeito
    'status_prefeito': 'status_prefeito',
    // Total votos
    'total_votos': 'total_votos',
    'votos': 'total_votos',
    // Votos válidos
    'votos_validos': 'votos_validos',
    // Vice
    'vice_prefeito': 'vice_prefeito',
    'vice': 'vice_prefeito',
    // Partido vice
    'partido_vice': 'partido_vice',
    // Status vice
    'status_vice': 'status_vice',
    // Apoio
    'apoio': 'apoio',
    'nao_apoio': 'nao_apoio',
    // Timestamps (ignorar na importação, mas reconhecer)
    'created_at': 'created_at',
    'updated_at': 'updated_at',
};

const FIELD_LABELS: Record<keyof Cidade, string> = {
    id: 'ID',
    name: 'Nome',
    mesorregiao: 'Mesorregião',
    eleitores: 'Eleitores',
    prefeito: 'Prefeito',
    partido: 'Partido',
    status_prefeito: 'Status Prefeito',
    total_votos: 'Total Votos',
    votos_validos: 'Votos Válidos',
    vice_prefeito: 'Vice-Prefeito',
    partido_vice: 'Partido Vice',
    status_vice: 'Status Vice',
    apoio: 'Apoio',
    nao_apoio: 'Não Apoio',
    created_at: 'Criado em',
    updated_at: 'Atualizado em',
};

export default function CSVUploadModal({ isOpen, onClose, onImport, existingCityIds }: CSVUploadModalProps) {
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'success'>('upload');
    const [parsedData, setParsedData] = useState<Partial<Cidade>[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [fileName, setFileName] = useState<string>('');
    const [importStats, setImportStats] = useState({ new: 0, updated: 0 });
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetModal = useCallback(() => {
        setStep('upload');
        setParsedData([]);
        setErrors([]);
        setFileName('');
        setImportStats({ new: 0, updated: 0 });
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

    // Função para gerar UUID
    const generateUUID = (): string => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };

    const mapCSVToCity = (headers: string[], row: string[]): Partial<Cidade> | null => {
        const city: Partial<Cidade> = {};

        headers.forEach((header, index) => {
            const field = CSV_COLUMN_MAP[header];
            // Ignora campos de timestamp - são gerenciados pelo banco
            if (field && field !== 'created_at' && field !== 'updated_at') {
                const rawValue = row[index];

                // Ignora valores undefined, null ou vazios
                if (rawValue === undefined || rawValue === null || rawValue === '') {
                    return;
                }

                const value = rawValue.replace(/^["']|["']$/g, '').trim();

                if (!value) return; // Ignora valores vazios após trim

                // Converte campos numéricos
                if (['eleitores', 'total_votos', 'votos_validos', 'apoio', 'nao_apoio'].includes(field)) {
                    const cleanedValue = value.replace(/\D/g, '');
                    if (cleanedValue) {
                        const numValue = parseInt(cleanedValue, 10);
                        if (!isNaN(numValue)) {
                            (city as Record<string, unknown>)[field] = numValue;
                        }
                    }
                    // Se não for um número válido, simplesmente não adiciona o campo
                } else {
                    (city as Record<string, unknown>)[field] = value;
                }
            }
        });

        // Se não tem ID, gera um UUID automático
        if (!city.id) {
            city.id = generateUUID();
        }

        // Validação: Nome é obrigatório
        if (!city.name) {
            return null;
        }

        return city;
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

                // Verifica se tem coluna de nome (obrigatório)
                const hasNameColumn = headers.some(h => ['name', 'nome', 'cidade', 'municipio', 'município'].includes(h));
                if (!hasNameColumn) {
                    setErrors(['O CSV precisa ter uma coluna "name", "nome" ou "cidade"']);
                    return;
                }

                const cities: Partial<Cidade>[] = [];
                const parseErrors: string[] = [];

                rows.forEach((row, index) => {
                    if (row.every(cell => !cell.trim())) return; // Ignora linhas vazias

                    const city = mapCSVToCity(headers, row);
                    if (city) {
                        cities.push(city);
                    } else {
                        parseErrors.push(`Linha ${index + 2}: Nome não encontrado`);
                    }
                });

                if (parseErrors.length > 0 && parseErrors.length <= 5) {
                    setErrors(parseErrors);
                } else if (parseErrors.length > 5) {
                    setErrors([...parseErrors.slice(0, 5), `... e mais ${parseErrors.length - 5} erros`]);
                }

                if (cities.length > 0) {
                    setParsedData(cities);

                    // Calcula estatísticas
                    const newCount = cities.filter(c => !existingCityIds.has(String(c.id))).length;
                    const updatedCount = cities.length - newCount;
                    setImportStats({ new: newCount, updated: updatedCount });

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
        const headers = ['id', 'name', 'mesorregiao', 'prefeito', 'partido', 'vice_prefeito', 'partido_vice', 'eleitores', 'votos_validos', 'total_votos', 'status_prefeito', 'status_vice', 'apoio', 'nao_apoio'];
        const exampleRow = ['4100103', 'Abatiá', 'Norte Pioneiro Paranaense', 'João Silva', 'PARTIDO', 'Maria Santos', 'PARTIDO2', '5000', '4200', '3500', 'Eleito', 'Eleito', '1', '0'];

        const csvContent = [headers.join(';'), exampleRow.join(';')].join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'modelo_cidades.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

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
                        <h2 className="text-lg font-semibold text-slate-800">Importar CSV</h2>
                        <p className="text-sm text-slate-500">Importe dados de cidades em massa</p>
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
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                                    {Object.entries(CSV_COLUMN_MAP).filter((entry, index, arr) =>
                                        arr.findIndex(e => e[1] === entry[1]) === index
                                    ).map(([key, value]) => (
                                        <div key={key} className="flex items-center gap-2 text-slate-600">
                                            <code className="px-2 py-0.5 bg-slate-100 rounded text-xs">{key}</code>
                                            <span className="text-slate-400">→</span>
                                            <span>{FIELD_LABELS[value]}</span>
                                        </div>
                                    ))}
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
                                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{parsedData.length}</p>
                                    <p className="text-xs text-emerald-600">registros</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-600">{importStats.new}</p>
                                    <p className="text-xs text-blue-600">novos</p>
                                </div>
                                <div className="bg-amber-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-amber-600">{importStats.updated}</p>
                                    <p className="text-xs text-amber-600">atualizações</p>
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

                            {/* Preview Table */}
                            <div>
                                <h4 className="font-medium text-slate-700 mb-3">Preview dos dados (primeiros 10):</h4>
                                <div className="border border-slate-200 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-slate-200">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">ID</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Nome</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Prefeito</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Partido</th>
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {parsedData.slice(0, 10).map((city, index) => (
                                                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                                                        <td className="px-4 py-3 text-sm text-slate-600 font-mono">{city.id}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-900 font-medium">{city.name || '—'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">{city.prefeito || '—'}</td>
                                                        <td className="px-4 py-3 text-sm text-slate-600">{city.partido || '—'}</td>
                                                        <td className="px-4 py-3">
                                                            {existingCityIds.has(String(city.id)) ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                                                                    Atualizar
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                                                                    Novo
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    {parsedData.length > 10 && (
                                        <div className="px-4 py-2 bg-slate-50 text-center text-sm text-slate-500">
                                            ... e mais {parsedData.length - 10} registros
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step: Importing */}
                    {step === 'importing' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-3 border-slate-200 border-t-blue-500 rounded-full animate-spin mb-6"></div>
                            <p className="text-lg font-medium text-slate-800">Importando dados...</p>
                            <p className="text-sm text-slate-500 mt-2">Aguarde enquanto processamos {parsedData.length} registros</p>
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
                                {parsedData.length} registros foram importados com sucesso
                            </p>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{importStats.new}</p>
                                    <p className="text-xs text-slate-500">novos</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-amber-600">{importStats.updated}</p>
                                    <p className="text-xs text-slate-500">atualizados</p>
                                </div>
                            </div>
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
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                Importar {parsedData.length} registros
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
