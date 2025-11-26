"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

// Tipos para as propriedades do GeoJSON
type GeoFeatureProps = {
    name: string;
    id?: string | number;
    mesorregiao?: string;
    prefeito?: string;
    partido?: string;
    apoio?: number;
    nao_apoio?: number;
    vereadores?: Array<{ nome: string; partido: string }>;
};

type GeoFeature = {
    id?: string;
    rsmKey?: string;
    properties: GeoFeatureProps;
};

export default function MapaBrasil() {
    const router = useRouter();
    const [geoData, setGeoData] = useState<Record<string, unknown> | null>(null);
    const [hoveredCity, setHoveredCity] = useState<string | null>(null);

    useEffect(() => {
        fetch("/data/municipios.json")
            .then((res) => {
                if (!res.ok) throw new Error("Falha ao carregar dados");
                return res.json();
            })
            .then((data) => {
                setGeoData(data);
            })
            .catch((err) => console.error("Erro ao carregar dados do mapa:", err));
    }, []);

    const handleClick = (geo: GeoFeature) => {
        const id = geo.id || geo.properties.id || geo.properties.name;
        if (id) {
            router.push(`/app/cidade/${encodeURIComponent(id)}`);
        }
    };

    if (!geoData) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-gradient-to-br from-slate-100 to-slate-200">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                    </div>
                </div>
                <p className="mt-4 text-slate-600 font-medium">Carregando mapa...</p>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full overflow-hidden">
            <div className="w-full h-full relative bg-gradient-to-br from-sky-50 via-cyan-50 to-teal-50">
                {/* Título flutuante */}
                <div className="absolute top-4 left-4 z-10">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 border border-slate-200/50">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Estado do Paraná
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">Selecione uma cidade para ver detalhes</p>
                    </div>
                </div>

                {/* Cidade em hover */}
                {hoveredCity && (
                    <div className="absolute top-4 right-4 z-10 animate-fade-in">
                        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 border border-emerald-200">
                            <p className="text-sm text-slate-500">Cidade selecionada:</p>
                            <p className="font-bold text-emerald-700 text-lg">{hoveredCity}</p>
                        </div>
                    </div>
                )}

                <ComposableMap
                    projection="geoMercator"
                    projectionConfig={{ center: [-51, -25], scale: 4000 }}
                    className="w-full h-full"
                >
                    <ZoomableGroup center={[-51, -25]} zoom={1}>
                        {geoData && (
                            <Geographies geography={geoData}>
                                {({ geographies }: { geographies: GeoFeature[] }) =>
                                    geographies.map((geo) => (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo as unknown as Record<string, unknown>}
                                            onClick={() => handleClick(geo)}
                                            onMouseEnter={() => setHoveredCity(geo.properties.name)}
                                            onMouseLeave={() => setHoveredCity(null)}
                                            data-tooltip-id="map-tooltip"
                                            data-tooltip-content={geo.properties.name}
                                            stroke="#94a3b8"
                                            strokeWidth={0.4}
                                            style={{
                                                default: {
                                                    fill: "#e2e8f0",
                                                    outline: "none",
                                                    transition: "all 0.2s ease-in-out"
                                                },
                                                hover: {
                                                    fill: "#10b981",
                                                    outline: "none",
                                                    cursor: "pointer",
                                                    stroke: "#047857",
                                                    strokeWidth: 1,
                                                    filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))"
                                                },
                                                pressed: {
                                                    fill: "#059669",
                                                    outline: "none"
                                                },
                                            }}
                                        />
                                    ))
                                }
                            </Geographies>
                        )}
                    </ZoomableGroup>
                </ComposableMap>

                {/* Controles de Zoom e informações */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                    <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-xl shadow-lg border border-slate-200/50 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs text-slate-600 font-medium">Scroll para zoom • Arraste para mover</span>
                    </div>
                </div>

                {/* Legenda */}
                <div className="absolute bottom-4 left-4 z-10">
                    <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg px-4 py-3 border border-slate-200/50">
                        <p className="text-xs font-semibold text-slate-700 mb-2">Legenda</p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded bg-slate-200 border border-slate-300"></div>
                                <span className="text-xs text-slate-600">Município</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded bg-emerald-500 border border-emerald-600"></div>
                                <span className="text-xs text-slate-600">Selecionado</span>
                            </div>
                        </div>
                    </div>
                </div>

                <Tooltip
                    id="map-tooltip"
                    className="!bg-slate-800 !text-white !rounded-lg !px-3 !py-2 !text-sm !font-medium !shadow-xl"
                />
            </div>
        </div>
    );
}
