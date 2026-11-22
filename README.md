# Fullstack 2 — Controle Financeiro Pessoal

Aplicação em que o usuário se cadastra, faz login e registra entradas e saídas de dinheiro, organizadas por categoria e por fonte/destino. A partir desses dados, a aplicação gera relatórios, a previsão das faturas dos cartões de crédito e uma análise de saúde financeira.

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
| Desafio | Página de saúde financeira com indicadores, projeção e dicas |

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Back-end | Node.js, Express, pg (PostgreSQL), bcrypt, jsonwebtoken, dotenv, cors, express-rate-limit, zod, nodemon |
| Front-end | React, Vite, react-router-dom, axios, MUI, react-imask, recharts |
| Banco de dados | PostgreSQL 16 |
| Infraestrutura | Docker e Docker Compose |
| Testes | node:test, node:assert e coleção de requisições do insomnia (Insomnia.json) |

## Estrutura do repositório

```text
Fullstack-2/
├── docker-compose.yml          - sobe banco, back-end e front-end
├── Insomnia.json               - coleção de requisições para testar a API no Insomnia
├── .gitignore                  - arquivos ignorados na raiz
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .gitignore
│   ├── .env.example            - modelo das variáveis de ambiente
│   ├── package.json
│   ├── database/               - schema.sql (criação das tabelas) e seed.js
│   └── src/
│       ├── server.js           - cria o app Express, registra middlewares e rotas
│       ├── routes/             - rotas (e controladores)
│       ├── models/             - acesso ao banco e regras de negócio/persistência
│       ├── middlewares/        - autenticação JWT, validação, rate limit e tratamento de erros
│       └── config/             - pool de conexão do banco e configurações do JWT
└── frontend/
    ├── Dockerfile
    ├── .dockerignore
    ├── .gitignore
    ├── .env.example            - modelo de variável de ambiente do front-end
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── eslint.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── theme.js            - tema MUI da aplicação
        ├── components/         - componentes e páginas
        ├── contexts/           - AuthContext e AuthProvider
        ├── hooks/              - hooks reutilizáveis (como estado e validação de formulários)
        ├── services/           - cliente HTTP (único ponto de acesso à API) e sessão
        └── utils/              - funções puras do front (validações, formatação e máscaras)
```

## Modelo de dados

Quatro tabelas: usuarios, categorias, fontes_destinos e lancamentos. O script completo está em backend/database/schema.sql.

- **usuarios**: email (sempre em minúsculas) e cpf (11 dígitos) com restrição UNIQUE; senha guardada apenas como hash (senha_hash)
- **categorias**: pertencem a um usuário e têm tipo (entrada ou saida); nome único por usuário e tipo.
- **fontes_destinos**: tipo (renda, conta ou cartao_credito); cartões exigem dia_fechamento, dia_vencimento e limite maior que zero
- **lancamentos**: valor positivo (NUMERIC(12, 2)), data, categoria e fonte/destino do mesmo usuário (garantido por chaves estrangeiras compostas) e campos de parcelamento (parcela_atual, total_parcelas, grupo_parcelamento), com unicidade em (grupo_parcelamento, parcela_atual)

Dinheiro é armazenado em NUMERIC(12, 2)

## Como executar

### Pré-requisitos

- Docker e Docker Compose
- Git

### Serviços

| Serviço | O que é | Porta |
|---|---|---|
| db | PostgreSQL 16, com volume para os dados | 5433 (host) / 5432 (rede Docker) |
| backend | API Node/Express | 3000 |
| frontend | Aplicação React com VIte | 5173 |

### Passo a passo

**1. Clonar o repositório**

```bash
git clone https://github.com/pukanski/Fullstack-2.git
cd Fullstack-2
```

**2. Configurar as variáveis de ambiente**

```bash
cp backend/.env.example backend/.env
```

Edite o backend/.env com os seus valores:

| Variável | Exemplo | Para que serve |
|---|---|---|
| POSTGRES_USER | financas | Usuário do banco criado no contêiner |
| POSTGRES_PASSWORD | 123456 | Senha do banco |
| POSTGRES_DB | financas | Nome do banco |
| DATABASE_URL | postgresql://financas:[senha]@db:5432/financas | Conexão da API com o banco |
| PORT | 3000 | Porta da API |
| JWT_SECRET | fraseAleatoria | Segredo usado para assinar os tokens |
| JWT_EXPIRES_IN | 1h | Validade do token |
| FRONTEND_URL | `http://localhost:5173` | Origem pelo CORS |

Os arquivos .env não vão para o repositório nem para as imagens (eles são protegidos pelos .gitignore e .dockerignore). Apenas os arquivos .env.example são versionados.

**3. Subir tudo**

```bash
docker compose up --build
```

Na primeira subida, o contêiner do banco executa automaticamente o backend/database/schema.sql e cria as tabelas. Quando carregar tudo os links são:

- Front-end: http://localhost:5173
- API: http://localhost:3000

**4. Carregar os dados de demonstração**

Em outro terminal, com os contêineres rodando:

```bash
docker compose exec backend npm run seed
```

O seed cria dois usuários de demonstração e lançamentos dos últimos 3 meses, incluindo compras parceladas:

| Usuário | Email | Senha |
|---|---|---|
| Ana Demonstração | ana.demo@financas.com | Demo1234 |
| Bruno Demonstração | bruno.demo@financas.com | Demo1234 |

### Comandos do Docker

| O que fazer | Comando |
|---|---|
| Parar os contêineres | docker compose down |
| Ver os logs da API | docker compose logs -f backend |
| Rodar os testes do back-end | docker compose exec backend npm test |
| Rodar os testes do front-end | docker compose exec frontend npm test |
| Apagar o banco e recriar do zero | docker compose down -v && docker compose up --build |

## Rotas da API

Todas as rotas abaixo de /api, exceto /api/health, /api/auth/cadastro e /api/auth/login, exigem Authorization: Bearer token.

| Método | Rota | Descrição |
|---|---|---|
| GET | /api/health | Verifica se a API está online |
| POST | /api/auth/cadastro | Cadastra usuário com categorias padrão e conta corrente |
| POST | /api/auth/login | Autentica e devolve o JWT |
| GET | /api/auth/me | Dados do usuário logado |
| GET, POST | /api/categorias | Lista e cria categorias |
| PUT, DELETE | /api/categorias/:id | Edita e exclui categoria |
| GET, POST | /api/fontes-destinos | Lista e cria fontes/destinos |
| PUT, DELETE | /api/fontes-destinos/:id | Edita e exclui fonte/destino |
| GET | /api/lancamentos | Lista com filtros (inicio, fim, tipo, categoriaId, fonteDestinoId, pagina), totais e paginação |
| POST | /api/lancamentos | Cria lançamento (com parcelas, se houver) |
| GET, PUT, DELETE | /api/lancamentos/:id | Detalha, edita e exclui lançamento (no DELETE, aceita ?todasParcelas=true) |
| GET | /api/relatorios/categorias | Relatório por categoria (inicio, fim) |
| GET | /api/relatorios/fontes-destinos | Relatório por fonte/destino (inicio, fim) |
| GET | /api/relatorios/faturas | Previsão de faturas|
| GET | /api/saude-financeira | Análise de saúde financeira, projeção e dicas (desafio) |

Formato único de erro, usado por todas as rotas:

```json
{
  "erro": "Dados inválidos.",
  "campos": {
    "valor": "O valor deve ser maior que zero."
  }
}
```

## Regras do desafio (Saúde financeira)

A análise de saúde financeira (GET /api/saude-financeira) é calculada em backend/src/models/saudeFinanceira.js, usando sempre centavos para evitar erros de arredondamento.

### Janela de análise e regime de caixa

- **Meses analisados**: os 3 meses fechados anteriores ao mês corrente (fuso horário de America/Sao_Paulo).
- **Regime de caixa**: entradas e saídas à vista entram no mês da data do lançamento; compras no cartão de crédito (à vista ou parceladas) entram no mês de vencimento da fatura, calculado por calcularFatura(data, cartao, parcelaAtual).
- **Médias adaptativas**: se o usuário tiver dados em apenas 1 ou 2 meses da janela, as médias mensais (renda média e saídas à vista médias) dividem pela quantidade real de meses com dados, evitando distorção para usuários novos
- **Dados insuficientes**: se não houver lançamentos nos 3 meses analisados (motivo: "sem-lancamentos") ou se a soma de entradas / renda média for zero (motivo: "sem-entradas"), a API retorna dadosSuficientes: false e a tela exibe um estado informativo sem erros de divisão por zero.

### Indicadores e faixas adotadas

| Indicador | Como é calculado | Saudável | Atenção / Informativo | Crítico |
|---|---|---|---|---|
| **Taxa de poupança** | ((entradas - saídas) / entradas) × 100 nos meses analisados | >= 10% | 0% a 9,9% (Atenção) | < 0% (gastou mais do que recebeu) |
| **Comprometimento com cartões** | Média das faturas dos próximos 3 meses ÷ renda média mensal | <= 30% | > 30% até 50% (Atenção) | > 50% |
| **Parcelas futuras** | Soma das parcelas de cartão nos próximos 6 meses e identificação do mês mais pesado | Sem parcelas | Mês mais pesado <= 30% da renda (Informativo) / > 30% (Atenção) | — |
| **Categorias fora da curva** | Compara o gasto de cada categoria no mês atual com sua média nos meses analisados | Variação <= 30% ou média < R$ 50,00 | Variação > 30% e média >= R$ 50,00 (Atenção; até 3 maiores) | — |

### Projeção e dicas

- **Projeção de 6 meses**: para cada um dos próximos 6 meses, estima saídas = média de saídas à vista + fatura prevista do mês, calcula o resultado = renda média - saídas e o saldo acumulado. Se algum mês ficar negativo, gera uma dica apontando o primeiro mês em déficit.
- **Priorização das dicas**: as dicas são ordenadas por gravidade (critico -> atencao -> informativo -> saudavel) e limitadas a no máximo 5 dicas por resposta.

## Decisões de projeto

- **Utilitários**: cpfValido e calcularFatura são funções puras e ficam em models, junto com as demais regras de negócio e sem acesso ao banco. A pasta config fica apenas com a conexão do banco e as configurações do JWT.
- **Parcelamento**: uma linha por parcela, todas com o mesmo grupo_parcelamento (gerado com crypto.randomUUID()). O valor é dividido em centavos e a diferença de arredondamento vai para a primeira parcela (R$ 100,00 em 3× = 33,34 + 33,33 + 33,33). As parcelas são gravadas em uma única transação.
- **Cálculo das faturas**: a data da compra é gravada em todas as parcelas, e a fatura é calculada sob demanda por calcularFatura(data, cartao, parcela_atual), em vez de gravar o vencimento em cada parcela. Os motivos são:
  - existe uma única fonte da verdade, sem dado derivado que possa ficar desatualizado;
  - editar ou excluir uma parcela não exige recalcular nada;
  - a regra fica em uma função pura, testável com os exemplos do enunciado;
  - o modelo de dados fica mais simples.
- **Autenticação no front-end**: todas as chamadas passam por services/api.js, que envia o token automaticamente e, em um 401 de requisição autenticada, encerra a sessão e redireciona para /login. O token e o usuário ficam no AuthContext e no localStorage, para o login sobreviver ao recarregamento da página. As telas internas ficam dentro de RotaProtegida.

## Segurança

- Senhas guardadas com hash e salt (bcrypt); a API nunca devolve senha_hash.
- Comparação contra um hash falso no login quando o e-mail não existe.
- Autenticação por JWT com expiração, validada por middleware.
- Toda consulta filtra por usuario_id vindo do token, nunca do corpo da requisição ou da URL.
- Consultas SQL parametrizadas.
- CORS restrito à origem do front-end e limite de tentativas (express-rate-limit) na rota de login.
- Segredos e credenciais apenas no backend/.env, ignorados pelo Git (.gitignore na raiz, backend/ e frontend/) e pelas imagens Docker (.dockerignore).

## Testes

### Testes automatizados

- **Back-end** (cálculo de fatura, parcelamento, filtros, períodos, validações e saúde financeira):
  ```bash
  docker compose exec backend npm test
  ```
- **Front-end** (validações, formatação de moeda/data e máscara de CPF):
  ```bash
  docker compose exec frontend npm test
  ```

### Como testar com o Insomnia

A coleção pronta está na raiz do repositório em Insomnia.json e cobre saúde da API, cadastro (incluindo e-mail e CPF duplicados), login, requisições sem token, token inválido, isolamento entre usuários, CRUDs completos, relatórios e saúde financeira.

1. Ver se os contêineres estão rodando (docker compose up -d) e que o seed foi executado (docker compose exec backend npm run seed).
2. Abra o Insomnia, clique em Import e selecione o arquivo Insomnia.json.
3. Na pasta "Autenticação", execute primeiro:
   - POST Login — Ana Demo (200)
   - POST Login — Bruno Demo (200)
   
   Os scripts pós-resposta salvam automaticamente os tokens nas variáveis token_ana e token_bruno do Base Environment.
4. Para testar os CRUDs e o isolamento entre usuários com IDs dinâmicos:
   - Execute POST Criar categoria (201) (pasta Categorias) — salva categoria_ana_id.
   - Execute POST Criar conta (201) e POST Criar cartão de crédito (201) (pasta Fontes e Destinos) — salvam fonte_ana_id e cartao_ana_id.
   - Execute POST Criar lançamento à vista (201) e POST Criar lançamento parcelado 3x no cartão (201) (pasta Lançamentos) — salvam lancamento_ana_id e lancamento_parcelado_id.
5. Execute a pasta "Segurança e Isolamento" para validar:
   - Requisições sem token e com token inválido retornando 401.
   - Tentativas do Bruno de ler, editar ou excluir registros da Ana retornando 404.
6. Execute as demais requisições de listagem, edição, exclusão (incluindo ?todasParcelas=true), relatórios e saúde financeira.

## Ferramentas de apoio

- Visual Studio Code
- Git / GitHub
- Docker / Docker Compose
- Insomnia