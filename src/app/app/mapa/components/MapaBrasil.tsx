"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

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
            router.push(`/cidade/${encodeURIComponent(id)}`);
        }
    };

    if (!geoData) {
        return (
            <div className="flex flex-col items-center justify-center h-full w-full bg-slate-100">
                <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
                <p className="mt-3 text-slate-500 text-sm">Carregando mapa...</p>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full overflow-hidden">
            <div className="w-full h-full relative bg-slate-50">
                <div className="absolute top-4 left-4 z-10">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm px-4 py-2 border border-slate-200">
                        <h2 className="text-base font-semibold text-slate-800">Paraná</h2>
                        <p className="text-xs text-slate-500">Clique em uma cidade</p>
                    </div>
                </div>

                {hoveredCity && (
                    <div className="absolute top-4 right-4 z-10">
                        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm px-4 py-2 border border-slate-200">
                            <p className="text-xs text-slate-500">Selecionado</p>
                            <p className="font-semibold text-slate-800">{hoveredCity}</p>
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

                <div className="absolute bottom-4 right-4 z-10">
                    <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm border border-slate-200">
                        <span className="text-xs text-slate-500">Scroll para zoom • Arraste para mover</span>
                    </div>
                </div>

                {/* Legenda */}
                <div className="absolute bottom-4 left-4 z-10">
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm px-3 py-2 border border-slate-200">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-slate-200 border border-slate-300"></div>
                                <span className="text-xs text-slate-500">Município</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded bg-emerald-500"></div>
                                <span className="text-xs text-slate-500">Hover</span>
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
