"use client";

import { useState } from "react";

interface EmpresarioFormData {
    nome: string;
    responsavel: string;
    telefone: string;
    email: string;
    empresa: string;
    segmento: string;
    endereco: string;
    observacoes: string;
}

interface EmpresarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: EmpresarioFormData) => Promise<void>;
}

export default function EmpresarioModal({ isOpen, onClose, onSubmit }: EmpresarioModalProps) {
    const [formData, setFormData] = useState<EmpresarioFormData>({
        nome: "",
        responsavel: "",
        telefone: "",
        email: "",
        empresa: "",
        segmento: "",
        endereco: "",
        observacoes: "",
    });
    const [saving, setSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.nome.trim()) return;

        setSaving(true);
        try {
            await onSubmit(formData);
            setFormData({
                nome: "",
                responsavel: "",
                telefone: "",
                email: "",
                empresa: "",
                segmento: "",
                endereco: "",
                observacoes: "",
            });
            onClose();
        } catch (error) {
            console.error("Erro ao salvar:", error);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({
            nome: "",
            responsavel: "",
            telefone: "",
            email: "",
            empresa: "",
            segmento: "",
            endereco: "",
            observacoes: "",
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-slate-800">
                            Adicionar Empresário
                        </h2>
                        <button
                            onClick={handleClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Nome do Empresário <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            placeholder="Ex: Carlos Oliveira"
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Empresa
                            </label>
                            <input
                                type="text"
                                name="empresa"
                                value={formData.empresa}
                                onChange={handleChange}
                                placeholder="Nome da empresa"
                                className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Segmento
                            </label>
                            <select
                                name="segmento"
                                value={formData.segmento}
                                onChange={handleChange}
                                className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white"
                            >
                                <option value="">Selecione...</option>
                                <option value="Agronegócio">Agronegócio</option>
                                <option value="Comércio">Comércio</option>
                                <option value="Construção">Construção</option>
                                <option value="Indústria">Indústria</option>
                                <option value="Saúde">Saúde</option>
                                <option value="Serviços">Serviços</option>
                                <option value="Tecnologia">Tecnologia</option>
                                <option value="Transporte">Transporte</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Pessoa de Contato
                        </label>
                        <input
                            type="text"
                            name="responsavel"
                            value={formData.responsavel}
                            onChange={handleChange}
                            placeholder="Ex: Maria Silva (Secretária)"
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Telefone
                            </label>
                            <input
                                type="tel"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleChange}
                                placeholder="(00) 00000-0000"
                                className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                E-mail
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="contato@empresa.com"
                                className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Endereço
                        </label>
                        <input
                            type="text"
                            name="endereco"
                            value={formData.endereco}
                            onChange={handleChange}
                            placeholder="Rua, número, bairro"
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Observações
                        </label>
                        <textarea
                            name="observacoes"
                            value={formData.observacoes}
                            onChange={handleChange}
                            placeholder="Informações adicionais..."
                            rows={3}
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving || !formData.nome.trim()}
                            className="flex-1 px-4 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Salvando...
                                </>
                            ) : (
                                "Adicionar"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
