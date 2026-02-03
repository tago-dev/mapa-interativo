"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

type CidadeStatus = {
    id: string;
    status_prefeito: string | null;
};

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

// Cores baseadas no status político
const STATUS_COLORS = {
    aliado: {
        fill: "#22c55e",      // green-500
        hover: "#16a34a",     // green-600
        stroke: "#15803d",    // green-700
    },
    neutro: {
        fill: "#eab308",      // yellow-500
        hover: "#ca8a04",     // yellow-600
        stroke: "#a16207",    // yellow-700
    },
    oposição: {
        fill: "#ef4444",      // red-500
        hover: "#dc2626",     // red-600
        stroke: "#b91c1c",    // red-700
    },
    default: {
        fill: "#e2e8f0",      // slate-200
        hover: "#94a3b8",     // slate-400
        stroke: "#64748b",    // slate-500
    },
};

export default function MapaBrasil() {
    const router = useRouter();
    const [geoData, setGeoData] = useState<Record<string, unknown> | null>(null);
    const [hoveredCity, setHoveredCity] = useState<string | null>(null);
    const [cidadesData, setCidadesData] = useState<CidadeStatus[]>([]);

    // Criar um Map para lookup rápido do status por ID da cidade
    const statusMap = useMemo(() => {
        const map = new Map<string, string>();
        cidadesData.forEach((cidade) => {
            if (cidade.id && cidade.status_prefeito) {
                map.set(cidade.id, cidade.status_prefeito.toLowerCase());
            }
        });
        return map;
    }, [cidadesData]);

    // Função para obter a cor baseada no status
    const getStatusColor = (cityId: string | number | undefined) => {
        if (!cityId) return STATUS_COLORS.default;
        const status = statusMap.get(String(cityId));
        if (status === "aliado") return STATUS_COLORS.aliado;
        if (status === "neutro") return STATUS_COLORS.neutro;
        if (status === "oposição") return STATUS_COLORS.oposição;
        return STATUS_COLORS.default;
    };

    useEffect(() => {
        // Carregar dados geográficos e dados das cidades em paralelo
        Promise.all([
            fetch("/data/municipios.json")
                .then((res) => {
                    if (!res.ok) throw new Error("Falha ao carregar dados geográficos");
                    return res.json();
                }),
            fetch("/api/cidades")
                .then((res) => {
                    if (!res.ok) throw new Error("Falha ao carregar dados das cidades");
                    return res.json();
                })
        ])
            .then(([geoJson, cidades]) => {
                setGeoData(geoJson);
                setCidadesData(cidades);
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
                                    geographies.map((geo) => {
                                        const cityId = geo.properties.id || geo.id;
                                        const colors = getStatusColor(cityId);

                                        return (
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
                                                        fill: colors.fill,
                                                        outline: "none",
                                                        transition: "all 0.2s ease-in-out"
                                                    },
                                                    hover: {
                                                        fill: colors.hover,
                                                        outline: "none",
                                                        cursor: "pointer",
                                                        stroke: colors.stroke,
                                                        strokeWidth: 1,
                                                        filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))"
                                                    },
                                                    pressed: {
                                                        fill: colors.stroke,
                                                        outline: "none"
                                                    },
                                                }}
                                            />
                                        );
                                    })
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
                    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-sm px-4 py-3 border border-slate-200">
                        <p className="text-xs font-medium text-slate-600 mb-2">Status Político</p>
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.aliado.fill }}></div>
                                <span className="text-xs text-slate-600">Aliado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.neutro.fill }}></div>
                                <span className="text-xs text-slate-600">Neutro</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: STATUS_COLORS.oposição.fill }}></div>
                                <span className="text-xs text-slate-600">Oposição</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded border border-slate-300" style={{ backgroundColor: STATUS_COLORS.default.fill }}></div>
                                <span className="text-xs text-slate-600">Não definido</span>
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
