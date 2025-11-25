"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchAllCities } from "@/utils/supabase/city";
import { Cidade } from "@/types/types";

export default function AdminDashboard() {
    const [geoCities, setGeoCities] = useState<{ id?: string | number; properties: { id?: string | number; name: string; mesorregiao: string;[key: string]: unknown } }[]>([]);
    const [dbCities, setDbCities] = useState<Cidade[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                // 1. Carregar lista completa do GeoJSON
                const res = await fetch("/data/municipios.json");
                const data = await res.json();
                const features = data.features || [];
                setGeoCities(features);

                // 2. Carregar cidades já registradas no Banco
                const registered = await fetchAllCities();
                setDbCities(registered);
            } catch (error) {
                console.error("Erro ao carregar dashboard:", error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    if (loading) return <div className="p-8 text-center">Carregando painel...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Painel Administrativo</h1>
                    <Link href="/app/mapa" className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded">
                        Voltar ao Mapa
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mesorregião</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {geoCities.map((feature) => {
                                const id = feature.id || feature.properties.id;
                                const name = feature.properties.name;
                                const isRegistered = dbCities.some(c => String(c.id) === String(id));

                                return (
                                    <tr key={id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{feature.properties.mesorregiao}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {isRegistered ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Registrado
                                                </span>
                                            ) : (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    Não Iniciado
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/app/admin/cidade/${encodeURIComponent(String(id || ""))}`}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                {isRegistered ? "Editar" : "Criar"}
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
