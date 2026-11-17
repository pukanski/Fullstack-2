# Fullstack 2 — Controle Financeiro Pessoal

Aplicação em que o usuário se cadastra, faz login e registra entradas e saídas de dinheiro, organizadas por categoria e por fonte/destino. A partir desses dados, a aplicação gera relatórios e a previsão das faturas dos cartões de crédito.

## Funcionalidades

| Requisito | Descrição |
|---|---|
| RF1 | Cadastro de usuário com validação no servidor (e-mail, CPF com dígitos verificadores, senha) e unicidade de e-mail e CPF garantida pelo banco |
| RF2 | Login com JWT, logout e token expirado levando de volta ao login |
| RF3 | Isolamento dos dados: cada usuário acessa apenas os próprios registros |
| RF4 | CRUD de categorias |
| RF5 | CRUD de fontes/destinos (conta, renda e cartão de crédito) |
| RF6 | CRUD de lançamentos, com filtros, paginação, totais e compras parceladas no cartão |
| RF7 | Relatório por categoria, com gráfico e comparação com o período anterior |
| RF8 | Relatório por fonte/destino |
| RF9 | Previsão das faturas dos cartões de crédito |
| Desafio | Página de saúde financeira |

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Back-end | Node.js, Express, pg (PostgreSQL), bcrypt, jsonwebtoken, dotenv, cors, express-rate-limit, zod, nodemon|
| Front-end | React, Vite, react-router-dom, axios, MUI, react-imask, recharts |
| Banco de dados | PostgreSQL |
| Infraestrutura | Docker e Docker Compose |
| Testes | node:test e node:assert, coleção de requisições do Postman/Insomnia |

## Estrutura do repositório

```
projeto2-financas/
├── docker-compose.yml          - sobe banco, back-end e front-end
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   ├── .env.example            - modelo das variáveis de ambiente
│   ├── database/               - schema.sql (criação das tabelas) e seed
│   └── src/
│       ├── server.js           - cria o app Express, registra middlewares e rotas
│       ├── routes/             - rotas (os controladores ficam aqui)
│       ├── models/             - acesso ao banco e regras de persistência
│       ├── middlewares/        - autenticação JWT, validação, tratamento de erros
│       └── config/             - pool de conexão do banco e configurações do JWT
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── .dockerignore
│   └── src/
│       ├── components/         - componentes e páginas
│       ├── contexts/           - AuthContext e demais contextos
│       ├── hooks/              - hooks reutilizáveis (ex.: estado e validação de formulários)
│       ├── services/           - cliente HTTP (único ponto de acesso à API)
│       └── utils/              - funções puras do front (validações, máscara de CPF)
└── README.md
```

## Modelo de dados

Quatro tabelas: usuarios, categorias, fontes_destinos e lancamentos. O script completo está em backend/database/schema.sql.

- usuarios: email e cpf com restrição UNIQUE; senha guardada apenas como hash.
- categorias: pertencem a um usuário e têm tipo entrada ou saida; nome único por usuário e tipo.
- fontes_destinos: tipo renda, conta ou cartao_credito; cartões exigem dia de fechamento, dia de vencimento e limite.
- lancamentos: valor positivo (NUMERIC), data, categoria e fonte/destino do mesmo usuário, e campos de parcelamento (parcela_atual, total_parcelas, grupo_parcelamento).

Dinheiro é armazenado em NUMERIC(12, 2) e nunca em ponto flutuante.

## Como executar

### Pré-requisitos

- Docker e Docker Compose
- Git

### Serviços

| Serviço | O que é | Porta |
|---|---|---|
| db | PostgreSQL 16, com volume para os dados | 5432 |
| backend | API Node/Express  | 3000 |
| frontend | Aplicação React servida pelo Vite | 5173 |

### Passo a passo

**1. Clonar o repositório**

```bash
git clone [link-do-repositorio]
cd [nome-da-pasta]
```

**2. Configurar as variáveis de ambiente**

```bash
cp backend/.env.example backend/.env
```

Edite o `backend/.env` com os seus valores:

| Variável | Exemplo | Para que serve |
|---|---|---|
| POSTGRES_USER | financas | Usuário do banco criado no contêiner |
| POSTGRES_PASSWORD | 123456 | Senha do banco |
| POSTGRES_DB | financas | Nome do banco |
| DATABASE_URL | postgresql://financas:[senha]@db:5432/financas | Conexão da API com o banco  |
| PORT | 3000 | Porta da API |
| JWT_SECRET | fraseAleatoria | Segredo usado para assinar os tokens |
| JWT_EXPIRES_IN | 1h | Validade do token |
| FRONTEND_URL | `http://localhost:5173`| Origem permitida pelo CORS |

O arquivo .env **não** vai para o repositório nem para as imagens. Só o .env.example que é versionado.

**3. Subir tudo**

```bash
docker compose up --build
```

Na primeira subida, o contêiner do banco executa sozinho o backend/database/schema.sql e cria as tabelas. Quando os três serviços estiverem de pé:

- Front-end: http://localhost:5173
- API: http://localhost:3000

**4. Carregar os dados de demonstração**

Em outro terminal, com os contêineres rodando:

```bash
docker compose exec backend npm run seed
```

O seed cria usuários de demonstração e lançamentos de 3 meses, incluindo compras parceladas

| Usuário | Email | Senha |
|---|---|---|
| Ana Demonstração | ana.demo@financas.com | Demo1234 |
| Bruno Demonstração | bruno.demo@financas.com | Demo1234 |

### Comandos do dcoker

| O que fazer | Comando |
|---|---|
| Parar os contêineres | docker compose down |
| Ver os logs da API | docker compose logs -f backend |
| Rodar os testes | docker compose exec backend npm test |
| Apagar o banco e recriar do zero | docker compose down -v e depois docker compose up --build |

## Rotas da API

Todas as rotas abaixo de /api, exceto cadastro e login, exigem o cabeçalho `Authorization: Bearer <token>`.

| Método | Rota | Descrição |
|---|---|---|
| POST | /api/auth/cadastro | Cadastra usuário |
| POST | /api/auth/login | Autentica e devolve o JWT |
| GET | /api/auth/me | Dados do usuário logado |
| GET, POST | /api/categorias | Lista e cria categorias |
| PUT, DELETE | /api/categorias/:id | Edita e exclui categoria |
| GET, POST | /api/fontes-destinos | Lista e cria fontes/destinos |
| PUT, DELETE | /api/fontes-destinos/:id | Edita e exclui fonte/destino (?todasParcelas=true) |
| GET | /api/lancamentos | Lista com filtros (inicio, fim, tipo, categoriaId, fonteDestinoId, pagina) |
| POST | /api/lancamentos | Cria lançamento (com parcelas, se houver) |
| GET, PUT, DELETE | /api/lancamentos/:id | Detalha, edita e exclui |
| GET | /api/relatorios/categorias | Relatório por categoria (inicio, fim) |
| GET | /api/relatorios/fontes-destinos | Relatório por fonte/destino (inicio, fim) |
| GET | /api/relatorios/faturas | Previsão de faturas (meses) |
| GET | /api/saude-financeira | Desafio |

Formato único de erro, usado por todas as rotas:

```json
{
  "erro": "Dados inválidos.",
  "campos": {
    "valor": "O valor deve ser maior que zero."
  }
}
```
## Decisões de projeto

- Utilitários: cpfValido e calcularFatura são funções puras e ficam no models, junto com as demais regras de negócio e sem acesso ao banco. Escolhemos models porque são regras do sistema, e não configuração. A pasta config fica só com a conexão do banco e as configurações do JWT.
- Parcelamento: uma linha por parcela, todas com o mesmo grupo_parcelamento (gerado com crypto.randomUUID()). O valor é dividido em centavos e a diferença de arredondamento vai para a primeira parcela (R$ 100,00 em 3× = 33,34 + 33,33 + 33,33). As parcelas são gravadas em uma única transação.
- Cálculo das faturas: a data da compra é gravada em todas as parcelas, e a fatura é calculada na hora por calcularFatura(data, cartao, parcela_atual), em vez de gravar o vencimento da fatura em cada parcela. Os motivos são:
  - existe uma única fonte da verdade, sem dado derivado que possa ficar desatualizado;
  - editar ou excluir uma parcela não exige recalcular nada;
  - a regra fica em uma função pura, testável com os exemplos do enunciado;
  - o modelo de dados fica mais simples.
  - Autenticação no front-end: todas as chamadas passam por `services/api.js` (axios), que envia o token sozinho e, em um 401 de requisição autenticada, encerra a sessão e volta para o login. O token e o usuário ficam no `AuthContext` e no localStorage, para o login sobreviver a um recarregamento. As telas internas ficam dentro de `RotaProtegida`. Os formulários repetem as validações do back-end para mostrar o erro antes do envio, e os erros devolvidos pela API (`campos`) aparecem junto do campo certo.


## Segurança

- Senhas guardadas com hash e salt (bcrypt); a API nunca devolve `senha_hash`.
- Autenticação por JWT com expiração, validada por middleware.
- Toda consulta filtra por usuario_id vindo do token, nunca do corpo da requisição ou da URL.
- Consultas parametrizadas.
- CORS restrito à origem do front-end e limite de tentativas na rota de login.
- Segredos e credenciais apenas no backend/.env, fora do Git e das imagens Docker (.dockerignore), o docker-compose.yml lê esse arquivo e não contém nenhuma senha.

## Testes

- Função de cálculo de fatura: docker compose exec backend npm test.
- Validações e máscara de CPF do front-end: docker compose exec frontend npm test.
- Coleção de requisições do Postman/Insomnia, cobrindo cadastro duplicado (e-mail e CPF), requisição sem token, token inválido e acesso a dados de outro usuário.

## Equipe

| Integrante | Responsabilidade principal |
|---|---|
| Gustavo Pukanski Schatzmann | Setup do projeto, autenticação, criação, parcelamento, listagem de lançamentos e documentação  |
| Orlando Cardoso Neto | Front-end: autenticação, lançamentos, relatórios, faturas e dashboard |
| Luiz Fernando Moreira Domênico |CRUDs de categorias e fontes/destinos, edição e exclusão de lançamentos, relatórios e faturas no back-end, telas de cadastros, seed, testes|

## Ferramentas de apoio

- Visual Studio Code
- Git/GitHub
- Docker
- Postman/Insomnia
