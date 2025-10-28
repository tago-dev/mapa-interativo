interface Cidade {
    nome: string;
    mesorregiao?: string;
}

export default function PainelCidade({ cidade }: { cidade: Cidade }) {
    return (
        <div>
            <h2 className="text-2xl font-bold">{cidade.nome}</h2>
            <p className="text-sm text-gray-500">{cidade.mesorregiao}</p>
            <hr className="my-3" />

            <div className="space-y-2">
                <p><strong>Prefeito:</strong> Fulano de Tal</p>
                <p><strong>Partido:</strong> PL</p>
                <p><strong>Apoio:</strong> 7</p>
                <p><strong>Não Apoio:</strong> 4</p>
            </div>
        </div>
    );
}
