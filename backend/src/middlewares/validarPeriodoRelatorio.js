import { z } from 'zod';
import { mesCorrente } from '../models/periodo.js';
import { ErroHttp } from './erros.js';

const vazioViraNada = (valor) => (typeof valor === 'string' && valor.trim() === '' ? undefined : valor);

const data = z.preprocess(
    vazioViraNada,
    z.iso.date({ error: 'Informe uma data válida no formato AAAA-MM-DD.' }).optional(),
);

export const esquemaPeriodo = z
    .object({ inicio: data, fim: data })
    .refine((dados) => !dados.inicio || dados.fim, { error: 'Informe também a data final.', path: ['fim'] })
    .refine((dados) => !dados.fim || dados.inicio, { error: 'Informe também a data inicial.', path: ['inicio'] })
    .refine((dados) => !dados.inicio || !dados.fim || dados.inicio <= dados.fim, {
        error: 'A data inicial não pode ser depois da data final.',
        path: ['inicio'],
    })
    .refine((dados) => !dados.inicio || dados.inicio >= '1900-01-01', {
        error: 'A data inicial deve ser a partir de 1900.',
        path: ['inicio'],
    })
    .transform((dados) => (dados.inicio ? { inicio: dados.inicio, fim: dados.fim } : mesCorrente()));

export function validarPeriodoRelatorio(req, res, next) {
    const resultado = esquemaPeriodo.safeParse(req.query);

    if (!resultado.success) {
        const campos = {};
        for (const problema of resultado.error.issues) {
            const campo = problema.path[0];
            if (campo !== undefined && !(campo in campos)) {
                campos[campo] = problema.message;
            }
        }
        throw new ErroHttp(400, 'Período inválido.', campos);
    }

    req.periodo = resultado.data;
    next();
}