export interface Cidade {
    id: string;
    name: string;
    mesorregiao?: string;
    eleitores?: number;
    prefeito?: string;
    partido?: string;
    status_prefeito?: string;
    total_votos?: number;
    vice_prefeito?: string;
    partido_vice?: string;
    status_vice?: string;
    apoio?: number;
    nao_apoio?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Vereador {
    id: string;
    cidade_id: string;
    nome: string;
    partido?: string;
    created_at?: string;
}

export interface Cooperativa {
    id: string;
    cidade_id: string;
    nome: string;
    created_at?: string;
}

export interface Empresario {
    id: string;
    cidade_id: string;
    nome: string;
    created_at?: string;
}

export interface CidadeCompleta extends Cidade {
    vereadores: Vereador[];
    cooperativas: Cooperativa[];
    empresarios: Empresario[];
}
