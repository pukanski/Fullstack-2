import { pool } from '../config/db.js';
import { ErroHttp } from '../middlewares/erros.js';

const COLUNAS = 'id, nome, tipo';
const MSG_REPETIDA = 'Já existe uma categoria com esse nome e tipo.';

function traduzirErro(erro, mensagemEmUso) {
    if (erro.code === '23505') return new ErroHttp(409, MSG_REPETIDA, { nome: MSG_REPETIDA });
    if (erro.code === '23503' && mensagemEmUso) return new ErroHttp(409, mensagemEmUso);
    return erro;
}

export async function listarCategorias(usuarioId) {
    const { rows } = await pool.query(
        `SELECT ${COLUNAS} FROM categorias WHERE usuario_id = $1 ORDER BY tipo, nome`,
        [usuarioId],
    );
    return rows;
}

export async function criarCategoria(usuarioId, { nome, tipo }) {
    try {
        const { rows } = await pool.query(
            `INSERT INTO categorias (usuario_id, nome, tipo) VALUES ($1, $2, $3) RETURNING ${COLUNAS}`,
            [usuarioId, nome, tipo],
        );
        return rows[0];
    } catch (erro) {
        throw traduzirErro(erro);
    }
}


export async function atualizarCategoria(usuarioId, id, { nome, tipo }) {
    try {
        const { rows } = await pool.query(
            `UPDATE categorias SET nome = $3, tipo = $4
       WHERE id = $1 AND usuario_id = $2
       RETURNING ${COLUNAS}`,
            [id, usuarioId, nome, tipo],
        );
        return rows[0] ?? null;
    } catch (erro) {
        
        throw traduzirErro(erro, 'Não é possível alterar o tipo de uma categoria em uso por lançamentos.');
    }
}
export async function excluirCategoria(usuarioId, id) {
    try {
        const { rowCount } = await pool.query('DELETE FROM categorias WHERE id = $1 AND usuario_id = $2', [id, usuarioId]);
        return rowCount > 0;
    } catch (erro) {
        throw traduzirErro(erro, 'Não é possível excluir uma categoria em uso por lançamentos.');
    }
}