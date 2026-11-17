import { randomUUID } from 'node:crypto';
import { pool } from '../config/db.js';
import { dividirEmCentavos } from './parcelamento.js';

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