import { z } from 'zod';
import { ErroHttp } from './erros.js';

const OBRIGATORIO = 'Campo obrigatório.';
const erroDeTipo = (mensagem) => (problema) => (problema.input === undefined ? OBRIGATORIO : mensagem);

export const esquemaCategoria = z.object({
    nome: z
        .string({ error: OBRIGATORIO })
        .trim()
        .min(1, OBRIGATORIO)
        .max(60, 'O nome deve ter no máximo 60 caracteres.'),
    tipo: z.enum(['entrada', 'saida'], { error: erroDeTipo("O tipo deve ser 'entrada' ou 'saida'.") }),
});

export function validarCategoria(req, res, next) {
    const resultado = esquemaCategoria.safeParse(req.body ?? {});

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