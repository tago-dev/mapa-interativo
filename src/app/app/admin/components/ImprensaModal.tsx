"use client";

import { useState, useEffect } from "react";
import { Imprensa } from "@/types/types";

interface ImprensaFormData {
    nome: string;
    tipo: string;
    responsavel: string;
    telefone: string;
    email: string;
    endereco: string;
    website: string;
    observacoes: string;
}

interface ImprensaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: ImprensaFormData) => Promise<void>;
    editingImprensa?: Imprensa | null;
}

export default function ImprensaModal({ isOpen, onClose, onSubmit, editingImprensa }: ImprensaModalProps) {
    const [formData, setFormData] = useState<ImprensaFormData>({
        nome: "",
        tipo: "",
        responsavel: "",
        telefone: "",
        email: "",
        endereco: "",
        website: "",
        observacoes: "",
    });
    const [saving, setSaving] = useState(false);

    const isEditing = !!editingImprensa;

    // Preencher formulário quando estiver editando
    useEffect(() => {
        if (editingImprensa) {
            setFormData({
                nome: editingImprensa.nome || "",
                tipo: editingImprensa.tipo || "",
                responsavel: editingImprensa.responsavel || "",
                telefone: editingImprensa.telefone || "",
                email: editingImprensa.email || "",
                endereco: editingImprensa.endereco || "",
                website: editingImprensa.website || "",
                observacoes: editingImprensa.observacoes || "",
            });
        } else {
            setFormData({
                nome: "",
                tipo: "",
                responsavel: "",
                telefone: "",
                email: "",
                endereco: "",
                website: "",
                observacoes: "",
            });
        }
    }, [editingImprensa, isOpen]);

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
            if (!isEditing) {
                setFormData({
                    nome: "",
                    tipo: "",
                    responsavel: "",
                    telefone: "",
                    email: "",
                    endereco: "",
                    website: "",
                    observacoes: "",
                });
            }
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
            tipo: "",
            responsavel: "",
            telefone: "",
            email: "",
            endereco: "",
            website: "",
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
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            <h2 className="text-lg font-semibold text-slate-800">
                                {isEditing ? "Editar Veículo de Imprensa" : "Adicionar Veículo de Imprensa"}
                            </h2>
                        </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Nome do Veículo <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                placeholder="Ex: Rádio Cidade FM"
                                className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Tipo
                            </label>
                            <select
                                name="tipo"
                                value={formData.tipo}
                                onChange={handleChange}
                                className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-white"
                            >
                                <option value="">Selecione...</option>
                                <option value="Rádio">Rádio</option>
                                <option value="TV">TV</option>
                                <option value="Jornal">Jornal</option>
                                <option value="Portal">Portal</option>
                                <option value="Revista">Revista</option>
                                <option value="Podcast">Podcast</option>
                                <option value="Blog">Blog</option>
                                <option value="Outro">Outro</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Website
                            </label>
                            <input
                                type="url"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://..."
                                className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                            />
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
                            placeholder="Ex: João Silva (Editor)"
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
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
                                className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
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
                                placeholder="contato@veiculo.com"
                                className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
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
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
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
                            placeholder="Informações adicionais, horários de programação, alcance..."
                            rows={3}
                            className="w-full border border-slate-200 rounded-lg p-3 text-sm text-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
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
                            className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                isEditing ? "Salvar Alterações" : "Adicionar"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
