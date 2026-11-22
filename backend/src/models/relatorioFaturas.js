import { pool } from '../config/db.js';
import { deslocarMes } from './meses.js';
import { hojeEmSaoPaulo } from './periodo.js';
import { montarPrevisaoDeFaturas } from './previsaoFaturas.js';

const MESES_DE_HISTORICO = 50;

export async function previsaoDeFaturas(usuarioId, quantidade, hoje = hojeEmSaoPaulo()) {
    const desde = `${deslocarMes(hoje.slice(0, 7), -MESES_DE_HISTORICO)}-01`;

    const [cartoes, compras] = await Promise.all([
        pool.query(
            `SELECT id, nome, dia_fechamento AS "diaFechamento", dia_vencimento AS "diaVencimento",
              limite::float8 AS limite
       FROM fontes_destinos
       WHERE usuario_id = $1 AND tipo = 'cartao_credito'
       ORDER BY nome`,
            [usuarioId],
        ),
        pool.query(
            `SELECT l.id AS "lancamentoId", l.fonte_destino_id AS "cartaoId", l.descricao, l.valor, l.data,
              l.parcela_atual AS "parcelaAtual", l.total_parcelas AS "totalParcelas"
       FROM lancamentos l
       JOIN fontes_destinos f ON f.id = l.fonte_destino_id AND f.usuario_id = l.usuario_id
       WHERE l.usuario_id = $1 AND l.tipo = 'saida' AND f.tipo = 'cartao_credito' AND l.data >= $2
       ORDER BY l.data, l.id`,
            [usuarioId, desde],
        ),
    ]);

    return montarPrevisaoDeFaturas({ cartoes: cartoes.rows, compras: compras.rows, hoje, quantidade });
}