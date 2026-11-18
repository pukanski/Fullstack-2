import { randomUUID } from 'node:crypto';
import { pool } from '../config/db.js';
import { montarWhere } from './filtros.js';
import { dividirEmCentavos } from './parcelamento.js';

export const ITENS_POR_PAGINA = 20;

export const COLUNAS_LANCAMENTO = `id, tipo, descricao, valor, data,
  categoria_id AS "categoriaId", fonte_destino_id AS "fonteDestinoId",
  parcela_atual AS "parcelaAtual", total_parcelas AS "totalParcelas",
  grupo_parcelamento AS "grupoParcelamento"`;

export async function buscarReferencias(usuarioId, categoriaId, fonteDestinoId) {
    const [categorias, fontes] = await Promise.all([
        pool.query('SELECT id, tipo FROM categorias WHERE id = $1 AND usuario_id = $2', [categoriaId, usuarioId]),
        pool.query('SELECT id, tipo FROM fontes_destinos WHERE id = $1 AND usuario_id = $2', [fonteDestinoId, usuarioId]),
    ]);
    return { categoria: categorias.rows[0] ?? null, fonte: fontes.rows[0] ?? null };
}

export async function criarLancamentos(usuarioId, dados) {
    const valores = dividirEmCentavos(dados.valor, dados.parcelas);
    const grupo = dados.parcelas > 1 ? randomUUID() : null;

    const cliente = await pool.connect();
    try {
        await cliente.query('BEGIN');

        const criados = [];
        for (let indice = 0; indice < dados.parcelas; indice++) {
            const { rows } = await cliente.query(
                `INSERT INTO lancamentos
           (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id,
            parcela_atual, total_parcelas, grupo_parcelamento)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING ${COLUNAS_LANCAMENTO}`,
                [
                    usuarioId, dados.tipo, dados.descricao, valores[indice], dados.data,
                    dados.categoriaId, dados.fonteDestinoId, indice + 1, dados.parcelas, grupo,
                ],
            );
            criados.push(rows[0]);
        }

        await cliente.query('COMMIT');
        return criados;
    } catch (erro) {
        await cliente.query('ROLLBACK');
        throw erro;
    } finally {
        cliente.release();
    }
}

const COLUNAS_LISTAGEM = `l.id, l.tipo, l.descricao, l.valor, l.data,
  l.categoria_id AS "categoriaId", c.nome AS "categoriaNome",
  l.fonte_destino_id AS "fonteDestinoId", f.nome AS "fonteDestinoNome",
  l.parcela_atual AS "parcelaAtual", l.total_parcelas AS "totalParcelas",
  l.grupo_parcelamento AS "grupoParcelamento"`;

export async function listarLancamentos(usuarioId, filtros) {
    const { where, parametros } = montarWhere(usuarioId, filtros);
    const deslocamento = (filtros.pagina - 1) * ITENS_POR_PAGINA;

    const [resumo, pagina] = await Promise.all([
        pool.query(
            `SELECT
         COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor END), 0) AS entradas,
         COALESCE(SUM(CASE WHEN l.tipo = 'saida' THEN l.valor END), 0) AS saidas,
         COALESCE(SUM(CASE WHEN l.tipo = 'entrada' THEN l.valor ELSE -l.valor END), 0) AS saldo,
         COUNT(*) AS total
       FROM lancamentos l
       WHERE ${where}`,
            parametros,
        ),
        pool.query(
            `SELECT ${COLUNAS_LISTAGEM}
       FROM lancamentos l
       JOIN categorias c ON c.id = l.categoria_id
       JOIN fontes_destinos f ON f.id = l.fonte_destino_id
       WHERE ${where}
       ORDER BY l.data DESC, l.id DESC
       LIMIT $${parametros.length + 1} OFFSET $${parametros.length + 2}`,
            [...parametros, ITENS_POR_PAGINA, deslocamento],
        ),
    ]);

    const { entradas, saidas, saldo, total } = resumo.rows[0];

    return {
        periodo: { inicio: filtros.inicio, fim: filtros.fim },
        totais: { entradas, saidas, saldo },
        paginacao: {
            pagina: filtros.pagina,
            porPagina: ITENS_POR_PAGINA,
            totalItens: total,
            totalPaginas: Math.max(1, Math.ceil(total / ITENS_POR_PAGINA)),
        },
        lancamentos: pagina.rows,
    };
}