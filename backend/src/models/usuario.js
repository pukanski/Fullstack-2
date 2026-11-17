import { pool } from '../config/db.js';
import { CATEGORIAS_PADRAO, CONTA_CORRENTE } from './padroes.js';

export async function criarUsuarioComPadroes({ nome, email, cpf, senhaHash }) {
    const cliente = await pool.connect();
    try {
        await cliente.query('BEGIN');

        const { rows: [usuario] } = await cliente.query(
            'INSERT INTO usuarios (nome, email, cpf, senha_hash) VALUES ($1, $2, $3, $4) RETURNING id, nome, email',
            [nome, email, cpf, senhaHash],
        );

        for (const categoria of CATEGORIAS_PADRAO) {
            await cliente.query(
                'INSERT INTO categorias (usuario_id, nome, tipo) VALUES ($1, $2, $3)',
                [usuario.id, categoria.nome, categoria.tipo],
            );
        }

        await cliente.query(
            'INSERT INTO fontes_destinos (usuario_id, nome, tipo) VALUES ($1, $2, $3)',
            [usuario.id, CONTA_CORRENTE.nome, CONTA_CORRENTE.tipo],
        );

        await cliente.query('COMMIT');
        return usuario;
    } catch (erro) {
        await cliente.query('ROLLBACK');
        throw erro;
    } finally {
        cliente.release();
    }
}
export async function buscarConflitos(email, cpf) {
    const { rows } = await pool.query(
        'SELECT email, cpf FROM usuarios WHERE email = $1 OR cpf = $2',
        [email, cpf],
    );
    return {
        email: rows.some((linha) => linha.email === email),
        cpf: rows.some((linha) => linha.cpf === cpf),
    };
}
export async function buscarPorEmail(email) {
    const { rows } = await pool.query(
        'SELECT id, nome, email, senha_hash FROM usuarios WHERE email = $1',
        [email],
    );
    return rows[0] ?? null;
}

export async function buscarPorId(id) {
    const { rows } = await pool.query(
        'SELECT id, nome, email FROM usuarios WHERE id = $1',
        [id],
    );
    return rows[0] ?? null;
}