# Mapa Interativo

Sistema de visualização e gerenciamento de dados municipais do Estado do Paraná.

## Visao Geral

Aplicacao web que permite visualizar municípios do Paraná em um mapa interativo, com painel administrativo para cadastro e edicao de informacoes sobre prefeitos, vereadores, cooperativas e empresários.

## Stack Tecnologica

- Next.js 15.5
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase (autenticacao e banco de dados)
- React Simple Maps (visualizacao geografica)

## Requisitos

- Node.js 18+
- Conta no Supabase com projeto configurado

## Configuracao

1. Clone o repositório:

```bash
git clone https://github.com/tago-dev/mapa-interativo.git
cd mapa-interativo
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente criando um arquivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. Execute o servidor de desenvolvimento:

```bash
npm run dev
```

5. Acesse `http://localhost:3000`

## Scripts Disponíveis

| Comando         | Descricao                                        |
| --------------- | ------------------------------------------------ |
| `npm run dev`   | Inicia servidor de desenvolvimento com Turbopack |
| `npm run build` | Gera build de producao                           |
| `npm run start` | Inicia servidor de producao                      |
| `npm run lint`  | Executa verificacao de lint                      |

## Estrutura do Projeto

```
src/
  app/
    app/
      admin/          # Painel administrativo
      cidade/[id]/    # Pagina publica da cidade
      mapa/           # Visualizacao do mapa
      perfil/         # Perfil do usuario
    login/            # Autenticacao
  types/              # Definicoes TypeScript
  utils/
    supabase/         # Cliente e funcoes do Supabase
public/
  data/
    municipios.json   # Dados geograficos dos municipios
```

## Funcionalidades

### Mapa Interativo

- Visualizacao de todos os municipios do Paraná
- Zoom e navegacao
- Selecao de cidade com redirecionamento para detalhes

### Painel Administrativo

- Listagem de todas as cidades com filtros por status e mesorregiao
- Cadastro rapido de cidades
- Edicao de dados municipais: prefeito, vice, vereadores, cooperativas, empresários

### Autenticacao

- Login via Supabase Auth
- Rotas protegidas com middleware

## Banco de Dados

Tabelas necessárias no Supabase:

- `cidades`: dados dos municipios
- `vereadores`: vereadores por cidade
- `cooperativas`: cooperativas por cidade
- `empresarios`: empresários por cidade

## Licenca

Projeto privado.
