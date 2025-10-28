"use client";
import { useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import PainelCidade from "./PainelCidade";
import geoData from "../data/municipios.json";

export default function MapaBrasil() {
    const [cidadeSelecionada, setCidadeSelecionada] = useState<any>(null);

    const handleClick = (geo: any) => {
        const { name, mesorregiao } = geo.properties;
        setCidadeSelecionada({ nome: name, mesorregiao });
    };

    return (
        <div className="flex w-full h-screen">
            <div className="w-2/3 bg-white">
                <ComposableMap
                    projection="geoMercator"
                    // Centro aproximado do Brasil e escala para enquadrar o país
                    projectionConfig={{ center: [-55, -15], scale: 900 }}
                    width={800}
                    height={600}
                >
                    <Geographies geography={geoData as any}>
                        {({ geographies }: any) =>
                            (geographies as any[]).map((geo: any) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    onClick={() => handleClick(geo)}
                                    stroke="#999"
                                    strokeWidth={0.5}
                                    style={{
                                        default: { fill: "#EEE", outline: "none" },
                                        hover: { fill: "#FACC15", outline: "none" },
                                        pressed: { fill: "#16A34A", outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>
                </ComposableMap>
            </div>

            {cidadeSelecionada ? (
                <div className="w-1/3 p-4 bg-yellow-100 overflow-auto">
                    <PainelCidade cidade={cidadeSelecionada} />
                </div>
            ) : (
                <div className="w-1/3 p-4 bg-gray-50 text-gray-600">
                    Clique em um município no mapa para ver detalhes.
                </div>
            )}
        </div>
    );
}