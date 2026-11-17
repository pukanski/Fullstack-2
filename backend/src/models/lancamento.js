import { pool } from '../config/db.js';

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

export async function criarLancamento(usuarioId, dados) {
    const { rows } = await pool.query(
        `INSERT INTO lancamentos (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING ${COLUNAS_LANCAMENTO}`,
        [usuarioId, dados.tipo, dados.descricao, dados.valor, dados.data, dados.categoriaId, dados.fonteDestinoId],
    );
    return rows[0];
}