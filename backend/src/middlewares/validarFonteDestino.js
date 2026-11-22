import { z } from 'zod';
import { ErroHttp } from './erros.js';

const OBRIGATORIO = 'Campo obrigatório.';
const MSG_DIA = 'Informe um dia de 1 a 31.';
const erroDeTipo = (mensagem) => (problema) => (problema.input === undefined ? OBRIGATORIO : mensagem);

const vazioViraNada = (valor) => (valor === null || (typeof valor === 'string' && valor.trim() === '') ? undefined : valor);
const inteiroDeTexto = (valor) => (typeof valor === 'string' && /^\d+$/.test(valor.trim()) ? Number(valor) : valor);
const decimalDeTexto = (valor) => (typeof valor === 'string' && /^\d+(\.\d{1,2})?$/.test(valor.trim()) ? Number(valor) : valor);

const dia = z.preprocess(
    (valor) => inteiroDeTexto(vazioViraNada(valor)),
    z.number({ error: MSG_DIA }).int(MSG_DIA).min(1, MSG_DIA).max(31, MSG_DIA).optional(),
);

const limite = z.preprocess(
    (valor) => decimalDeTexto(vazioViraNada(valor)),
    z
        .number({ error: 'Informe um valor numérico.' })
        .gt(0, 'O limite deve ser maior que zero.')
        .max(9999999999.99, 'O limite é grande demais.')
        .refine((numero) => Math.abs(numero * 100 - Math.round(numero * 100)) < 1e-6, 'Use no máximo 2 casas decimais.')
        .transform((numero) => Math.round(numero * 100) / 100)
        .optional(),
);

export const esquemaFonteDestino = z
    .object({
        nome: z
            .string({ error: OBRIGATORIO })
            .trim()
            .min(1, OBRIGATORIO)
            .max(60, 'O nome deve ter no máximo 60 caracteres.'),
        tipo: z.enum(['renda', 'conta', 'cartao_credito'], {
            error: erroDeTipo("O tipo deve ser 'renda', 'conta' ou 'cartao_credito'."),
        }),
        diaFechamento: dia,
        diaVencimento: dia,
        limite,
    })
    .superRefine((dados, ctx) => {
        if (dados.tipo !== 'cartao_credito') return;
        for (const campo of ['diaFechamento', 'diaVencimento', 'limite']) {
            if (dados[campo] === undefined) {
                ctx.addIssue({ code: 'custom', message: 'Obrigatório para cartão de crédito.', path: [campo] });
            }
        }
    })
    
    .transform((dados) =>
        dados.tipo === 'cartao_credito'
            ? dados
            : { ...dados, diaFechamento: null, diaVencimento: null, limite: null },
    );

export function validarFonteDestino(req, res, next) {
    const resultado = esquemaFonteDestino.safeParse(req.body ?? {});

    if (!resultado.success) {
        const campos = {};
        for (const problema of resultado.error.issues) {
            const campo = problema.path[0];
            if (campo !== undefined && !(campo in campos)) {
                campos[campo] = problema.message;
            }
        }
        throw new ErroHttp(400, 'Dados inválidos.', campos);
    }

    req.body = resultado.data;
    next();
}