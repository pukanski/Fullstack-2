BEGIN;

CREATE TABLE usuarios (
  id          SERIAL PRIMARY KEY,
  nome        VARCHAR(120) NOT NULL,
  email       VARCHAR(160) NOT NULL,
  cpf         CHAR(11)     NOT NULL,
  senha_hash  VARCHAR(100) NOT NULL,
  criado_em   TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT usuarios_email_unico     UNIQUE (email),
  CONSTRAINT usuarios_cpf_unico       UNIQUE (cpf),
  CONSTRAINT usuarios_email_minusculo CHECK (email = LOWER(email)),
  CONSTRAINT usuarios_cpf_so_digitos  CHECK (cpf ~ '^[0-9]{11}$')
);

CREATE TABLE categorias (
  id          SERIAL PRIMARY KEY,
  usuario_id  INTEGER     NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  nome        VARCHAR(60) NOT NULL,
  tipo        VARCHAR(7)  NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  UNIQUE (usuario_id, nome, tipo),
  UNIQUE (id, usuario_id, tipo)
);

CREATE TABLE fontes_destinos (
  id              SERIAL PRIMARY KEY,
  usuario_id      INTEGER     NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  nome            VARCHAR(60) NOT NULL,
  tipo            VARCHAR(14) NOT NULL CHECK (tipo IN ('renda', 'conta', 'cartao_credito')),
  dia_fechamento  SMALLINT CHECK (dia_fechamento BETWEEN 1 AND 31),
  dia_vencimento  SMALLINT CHECK (dia_vencimento BETWEEN 1 AND 31),
  limite          NUMERIC(12, 2) CHECK (limite > 0),
  UNIQUE (usuario_id, nome),
  UNIQUE (id, usuario_id),
  CHECK (tipo <> 'cartao_credito'
         OR (dia_fechamento IS NOT NULL AND dia_vencimento IS NOT NULL AND limite IS NOT NULL))
);

CREATE TABLE lancamentos (
  id                  SERIAL PRIMARY KEY,
  usuario_id          INTEGER        NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  tipo                VARCHAR(7)     NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  descricao           VARCHAR(120)   NOT NULL,
  valor               NUMERIC(12, 2) NOT NULL CHECK (valor > 0),
  data                DATE           NOT NULL,
  categoria_id        INTEGER        NOT NULL,
  fonte_destino_id    INTEGER        NOT NULL,
  parcela_atual       SMALLINT       NOT NULL DEFAULT 1,
  total_parcelas      SMALLINT       NOT NULL DEFAULT 1 CHECK (total_parcelas BETWEEN 1 AND 48),
  grupo_parcelamento  UUID,
  criado_em           TIMESTAMP      NOT NULL DEFAULT NOW(),
  CHECK (parcela_atual BETWEEN 1 AND total_parcelas),
  CHECK (total_parcelas = 1 OR grupo_parcelamento IS NOT NULL),
  FOREIGN KEY (categoria_id, usuario_id, tipo) REFERENCES categorias (id, usuario_id, tipo),
  FOREIGN KEY (fonte_destino_id, usuario_id) REFERENCES fontes_destinos (id, usuario_id)
);

CREATE INDEX idx_lancamentos_usuario_data ON lancamentos (usuario_id, data);
CREATE INDEX idx_lancamentos_grupo ON lancamentos (grupo_parcelamento)
  WHERE grupo_parcelamento IS NOT NULL;

COMMIT;