export interface Cidade {
    id: string;
    name: string;
    mesorregiao?: string;
    eleitores?: number;
    prefeito?: string;
    partido?: string;
    status_prefeito?: string;
    total_votos?: number;
    votos_validos?: number;
    vice_prefeito?: string;
    partido_vice?: string;
    status_vice?: string;
    apoio?: number;
    nao_apoio?: number;
    modo_contagem_vereadores?: "auto" | "manual";
    created_at?: string;
    updated_at?: string;
}

export type VereadorPosicao = "aliado" | "neutro" | "oposicao";

export interface Vereador {
    id: string;
    cidade_id: string;
    nome: string;
    partido?: string;
    posicao?: VereadorPosicao;
    created_at?: string;
}

export interface Cooperativa {
    id: string;
    cidade_id: string;
    nome: string;
    responsavel?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    observacoes?: string;
    created_at?: string;
}

export interface Empresario {
    id: string;
    cidade_id: string;
    nome: string;
    responsavel?: string;
    telefone?: string;
    email?: string;
    empresa?: string;
    segmento?: string;
    endereco?: string;
    observacoes?: string;
    created_at?: string;
}

export interface Imprensa {
    id: string;
    cidade_id: string;
    nome: string;
    tipo?: string; // jornal, rádio, tv, portal, etc.
    responsavel?: string;
    telefone?: string;
    email?: string;
    endereco?: string;
    website?: string;
    observacoes?: string;
    created_at?: string;
}

export interface CidadeCompleta extends Cidade {
    vereadores: Vereador[];
    cooperativas: Cooperativa[];
    empresarios: Empresario[];
    imprensa: Imprensa[];
}
