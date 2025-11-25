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

    useEffect(() => {
        console.log("Iniciando fetch dos dados...");
        fetch("/data/municipios.json")
            .then((res) => {
                console.log("Resposta do fetch:", res.status);
                if (!res.ok) throw new Error("Falha ao carregar dados");
                return res.json();
            })
            .then((data) => {
                console.log("Dados carregados:", data);
                setGeoData(data);
            })
            .catch((err) => console.error("Erro ao carregar dados do mapa:", err));
    }, []);

    const handleClick = (geo: GeoFeature) => {
        // Prioriza o ID (pode estar na raiz ou em properties), senão usa o nome
        // O GeoJSON do tbrugz tem o id dentro de properties
        const id = geo.id || geo.properties.id || geo.properties.name;
        if (id) {
            router.push(`/app/cidade/${encodeURIComponent(id)}`);
        }
    };

    if (!geoData) {
        return (
            <div className="flex items-center justify-center h-full w-full bg-gray-100 text-gray-500">
                Carregando mapa...
            </div>
        );
    }

    return (
        <div className="flex h-full w-full bg-gray-100 overflow-hidden">
            <div className="w-full h-full relative bg-blue-50">
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
                                            data-tooltip-id="map-tooltip"
                                            data-tooltip-content={geo.properties.name}
                                            stroke="#FFF"
                                            strokeWidth={0.5}
                                            style={{
                                                default: { fill: "#D1D5DB", outline: "none" },
                                                hover: { fill: "#FACC15", outline: "none", cursor: "pointer" },
                                                pressed: { fill: "#16A34A", outline: "none" },
                                            }}
                                        />
                                    ))
                                }
                            </Geographies>
                        )}
                    </ZoomableGroup>
                </ComposableMap>

                {/* Controles de Zoom manuais (opcional, mas útil) */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                    <div className="bg-white p-2 rounded shadow text-xs text-gray-500">
                        Use scroll para zoom e arraste para mover
                    </div>
                </div>
                <Tooltip id="map-tooltip" />
            </div>
        </div>
    );
}
