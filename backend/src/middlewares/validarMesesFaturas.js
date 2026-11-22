import { z } from 'zod';
import { ErroHttp } from './erros.js';

const MENSAGEM = 'Informe um número inteiro de 1 a 12.';
const QUANTIDADE_PADRAO = 4;

const numeroDeTexto = (valor) => {
    if (typeof valor !== 'string') return valor;
    if (valor.trim() === '') return undefined;
    return /^\d+$/.test(valor.trim()) ? Number(valor) : valor;
};

export const esquemaMesesFaturas = z
    .object({
        meses: z.preprocess(
            numeroDeTexto,
            z.number({ error: MENSAGEM }).int(MENSAGEM).min(1, MENSAGEM).max(12, MENSAGEM).optional(),
        ),
    })
    .transform((dados) => ({ meses: dados.meses ?? QUANTIDADE_PADRAO }));

export function validarMesesFaturas(req, res, next) {
    const resultado = esquemaMesesFaturas.safeParse(req.query);

    if (!resultado.success) {
        throw new ErroHttp(400, 'Parâmetro inválido.', { meses: MENSAGEM });
    }

    req.meses = resultado.data.meses;
    next();
}