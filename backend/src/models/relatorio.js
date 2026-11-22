import { pool } from '../config/db.js';

const DIA_EM_MS = 86_400_000;
const emMs = (iso) => Date.parse(`${iso}T00:00:00Z`);
const emISO = (ms) => new Date(ms).toISOString().slice(0, 10);


export function periodoAnterior({ inicio, fim }) {
    const dias = (emMs(fim) - emMs(inicio)) / DIA_EM_MS + 1;
    return {
        inicio: emISO(emMs(inicio) - dias * DIA_EM_MS),
        fim: emISO(emMs(inicio) - DIA_EM_MS),
    };
}
const SQL_POR_CATEGORIA = `
  WITH por_categoria AS (
    SELECT c.id, c.nome, c.tipo,
           COALESCE(SUM(l.valor) FILTER (WHERE l.data BETWEEN $2 AND $3), 0) AS total,
           COALESCE(SUM(l.valor) FILTER (WHERE l.data BETWEEN $4 AND $5), 0) AS total_anterior
    FROM categorias c
    JOIN lancamentos l ON l.categoria_id = c.id AND l.usuario_id = c.usuario_id
    WHERE c.usuario_id = $1 AND l.data BETWEEN $4 AND $3
    GROUP BY c.id, c.nome, c.tipo
  ),
  com_totais AS (
    SELECT *,
           SUM(total) OVER (PARTITION BY tipo) AS total_tipo,
           SUM(total_anterior) OVER (PARTITION BY tipo) AS total_tipo_anterior
    FROM por_categoria
  )
  SELECT id AS "categoriaId", nome, tipo,
         total::float8 AS total,
         total_anterior::float8 AS "totalAnterior",
         CASE WHEN total_tipo = 0 THEN 0
              ELSE ROUND(total * 100 / total_tipo, 2) END::float8 AS percentual,
         CASE WHEN total_anterior = 0 THEN NULL
              ELSE ROUND((total - total_anterior) * 100 / total_anterior, 2) END::float8 AS "variacaoPercentual",
         total_tipo::float8 AS "totalTipo",
         total_tipo_anterior::float8 AS "totalTipoAnterior",
         CASE WHEN total_tipo_anterior = 0 THEN NULL
              ELSE ROUND((total_tipo - total_tipo_anterior) * 100 / total_tipo_anterior, 2) END::float8 AS "variacaoTipo"
  FROM com_totais
  ORDER BY tipo, total DESC, total_anterior DESC, nome`;

function agruparPorTipo(linhas, tipo) {
    const doTipo = linhas.filter((linha) => linha.tipo === tipo);
    const [resumo] = doTipo;
    return {
        total: resumo?.totalTipo ?? 0,
        totalAnterior: resumo?.totalTipoAnterior ?? 0,
        variacaoPercentual: resumo?.variacaoTipo ?? null,
        categorias: doTipo.map((l) => ({
            categoriaId: l.categoriaId,
            nome: l.nome,
            total: l.total,
            percentual: l.percentual,
            totalAnterior: l.totalAnterior,
            variacaoPercentual: l.variacaoPercentual,
        })),
    };
}

export async function relatorioPorCategoria(usuarioId, periodo) {
    const anterior = periodoAnterior(periodo);
    const { rows } = await pool.query(SQL_POR_CATEGORIA, [
        usuarioId, periodo.inicio, periodo.fim, anterior.inicio, anterior.fim,
    ]);

    return {
        periodo: { inicio: periodo.inicio, fim: periodo.fim },
        periodoAnterior: anterior,
        saidas: agruparPorTipo(rows, 'saida'),
        entradas: agruparPorTipo(rows, 'entrada'),
    };
}

// Total de lançamentos de um tipo por fonte/destino, do maior para o menor
function totaisPorFonteDestino(usuarioId, tipo, { inicio, fim }) {
    return pool.query(
        `SELECT f.id AS "fonteDestinoId", f.nome, f.tipo, SUM(l.valor)::float8 AS total
     FROM lancamentos l
     JOIN fontes_destinos f ON f.id = l.fonte_destino_id AND f.usuario_id = l.usuario_id
     WHERE l.usuario_id = $1 AND l.tipo = $2 AND l.data BETWEEN $3 AND $4
     GROUP BY f.id, f.nome, f.tipo
     ORDER BY SUM(l.valor) DESC, f.nome`,
        [usuarioId, tipo, inicio, fim],
    );
}

// Saldo do período de cada conta (contas sem movimento aparecem zeradas)
function saldoPorConta(usuarioId, { inicio, fim }) {
    return pool.query(
        `SELECT f.id AS "fonteDestinoId", f.nome,
            COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'entrada'), 0)::float8 AS entradas,
            COALESCE(SUM(l.valor) FILTER (WHERE l.tipo = 'saida'), 0)::float8 AS saidas,
            COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor ELSE -l.valor END), 0)::float8 AS saldo
     FROM fontes_destinos f
     LEFT JOIN lancamentos l
       ON l.fonte_destino_id = f.id AND l.usuario_id = f.usuario_id AND l.data BETWEEN $2 AND $3
     WHERE f.usuario_id = $1 AND f.tipo = 'conta'
     GROUP BY f.id, f.nome
     ORDER BY f.nome`,
        [usuarioId, inicio, fim],
    );
}

export async function relatorioPorFonteDestino(usuarioId, periodo) {
    const [entradas, saidas, contas] = await Promise.all([
        totaisPorFonteDestino(usuarioId, 'entrada', periodo),
        totaisPorFonteDestino(usuarioId, 'saida', periodo),
        saldoPorConta(usuarioId, periodo),
    ]);

    return {
        periodo: { inicio: periodo.inicio, fim: periodo.fim },
        entradasPorFonte: entradas.rows,
        saidasPorDestino: saidas.rows,
        saldoPorConta: contas.rows,
    };
}