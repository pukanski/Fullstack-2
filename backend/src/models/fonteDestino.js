import { pool } from '../config/db.js';
import { ErroHttp } from '../middlewares/erros.js';

const COLUNAS = `id, nome, tipo, dia_fechamento AS "diaFechamento",
  dia_vencimento AS "diaVencimento", limite::float8 AS limite`;
const MSG_REPETIDA = 'Já existe uma fonte/destino com esse nome.';

function traduzirErro(erro, mensagemEmUso) {
    if (erro.code === '23505') return new ErroHttp(409, MSG_REPETIDA, { nome: MSG_REPETIDA });
    if (erro.code === '23503' && mensagemEmUso) return new ErroHttp(409, mensagemEmUso);
    return erro;
}

export async function listarFontesDestinos(usuarioId) {
    const { rows } = await pool.query(
        `SELECT ${COLUNAS} FROM fontes_destinos WHERE usuario_id = $1 ORDER BY tipo, nome`,
        [usuarioId],
    );
    return rows;
}

export async function criarFonteDestino(usuarioId, dados) {
    try {
        const { rows } = await pool.query(
            `INSERT INTO fontes_destinos (usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUNAS}`,
            [usuarioId, dados.nome, dados.tipo, dados.diaFechamento, dados.diaVencimento, dados.limite],
        );
        return rows[0];
    } catch (erro) {
        throw traduzirErro(erro);
    }
}


export async function atualizarFonteDestino(usuarioId, id, dados) {
    try {
        const { rows } = await pool.query(
            `UPDATE fontes_destinos
       SET nome = $3, tipo = $4, dia_fechamento = $5, dia_vencimento = $6, limite = $7
       WHERE id = $1 AND usuario_id = $2
       RETURNING ${COLUNAS}`,
            [id, usuarioId, dados.nome, dados.tipo, dados.diaFechamento, dados.diaVencimento, dados.limite],
        );
        return rows[0] ?? null;
    } catch (erro) {
        throw traduzirErro(erro);
    }
}
export async function excluirFonteDestino(usuarioId, id) {
    try {
        const { rowCount } = await pool.query('DELETE FROM fontes_destinos WHERE id = $1 AND usuario_id = $2', [id, usuarioId]);
        return rowCount > 0;
    } catch (erro) {
        throw traduzirErro(erro, 'Não é possível excluir uma fonte/destino que possui lançamentos.');
    }
}