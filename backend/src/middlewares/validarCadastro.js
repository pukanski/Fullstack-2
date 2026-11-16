import { z } from 'zod';
import { cpfValido } from '../models/cpf.js';
import { ErroHttp } from './erros.js';

const OBRIGATORIO = 'Campo obrigatório.';

const nome = z
    .string({ error: OBRIGATORIO })
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(120, 'O nome deve ter no máximo 120 caracteres.');

const email = z
    .string({ error: OBRIGATORIO })
    .trim()
    .toLowerCase()
    .min(1, OBRIGATORIO)
    .max(160, 'O e-mail deve ter no máximo 160 caracteres.')
    .pipe(z.email('E-mail inválido.'));

const cpf = z
    .string({ error: OBRIGATORIO })
    .transform((valor) => valor.replace(/\D/g, ''))
    .pipe(
        z
            .string()
            .min(1, OBRIGATORIO)
            .refine(cpfValido, 'CPF inválido.'),
    );

const senha = z
    .string({ error: OBRIGATORIO })
    .min(1, OBRIGATORIO)
    .min(8, 'A senha deve ter no mínimo 8 caracteres.')
    .refine((valor) => /\p{L}/u.test(valor) && /\d/.test(valor), 'A senha deve conter letras e números.')
    .refine((valor) => Buffer.byteLength(valor, 'utf8') <= 72, 'A senha deve ter no máximo 72 caracteres.');

export const esquemaCadastro = z
    .object({
        nome,
        email,
        cpf,
        senha,
        confirmacaoSenha: z.string({ error: OBRIGATORIO }).min(1, OBRIGATORIO),
    })
    .refine((dados) => dados.senha === dados.confirmacaoSenha, {
        error: 'As senhas não conferem.',
        path: ['confirmacaoSenha'],
    })
    .transform(({ confirmacaoSenha, ...dados }) => dados);

export function validarCadastro(req, res, next) {
    const resultado = esquemaCadastro.safeParse(req.body ?? {});

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