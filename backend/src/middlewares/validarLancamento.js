import { z } from 'zod';
import { ErroHttp } from './erros.js';

const OBRIGATORIO = 'Campo obrigatório.';

const erroDeTipo = (mensagem) => (problema) => (problema.input === undefined ? OBRIGATORIO : mensagem);
const inteiroDeTexto = (valor) => (typeof valor === 'string' && /^\d+$/.test(valor.trim()) ? Number(valor) : valor);
const decimalDeTexto = (valor) => (typeof valor === 'string' && /^\d+(\.\d{1,2})?$/.test(valor.trim()) ? Number(valor) : valor);

const idDoBanco = z.preprocess(
    inteiroDeTexto,
    z
        .number({ error: erroDeTipo('Informe um número inteiro.') })
        .int('Informe um número inteiro.')
        .min(1, 'Informe um valor válido.')
        .max(2147483647, 'Informe um valor válido.'),
);

const valor = z.preprocess(
    decimalDeTexto,
    z
        .number({ error: erroDeTipo('Informe um valor numérico.') })
        .gt(0, 'O valor deve ser maior que zero.')
        .min(0.01, 'O valor mínimo é R$ 0,01.')
        .max(9999999999.99, 'O valor é grande demais.')
        .refine((numero) => Math.abs(numero * 100 - Math.round(numero * 100)) < 1e-6, 'Use no máximo 2 casas decimais.')
        .transform((numero) => Math.round(numero * 100) / 100),
);

export const esquemaLancamento = z
    .object({
        tipo: z.enum(['entrada', 'saida'], { error: erroDeTipo("O tipo deve ser 'entrada' ou 'saida'.") }),
        descricao: z
            .string({ error: OBRIGATORIO })
            .trim()
            .min(1, OBRIGATORIO)
            .max(120, 'A descrição deve ter no máximo 120 caracteres.'),
        valor,
        data: z.iso.date({ error: erroDeTipo('Informe uma data válida no formato AAAA-MM-DD.') }),
        categoriaId: idDoBanco,
        fonteDestinoId: idDoBanco,
        parcelas: z
            .preprocess(
                inteiroDeTexto,
                z
                    .number({ error: erroDeTipo('Informe um número inteiro.') })
                    .int('Informe um número inteiro.')
                    .min(1, 'O número de parcelas deve ser de 1 a 48.')
                    .max(48, 'O número de parcelas deve ser de 1 a 48.'),
            )
            .optional(),
    })
    .transform((dados) => ({ ...dados, parcelas: dados.parcelas ?? 1 }));

export function validarLancamento(req, res, next) {
    const resultado = esquemaLancamento.safeParse(req.body ?? {});

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