import { z } from 'zod';
import { ErroHttp } from './erros.js';

const OBRIGATORIO = 'Campo obrigatório.';

const esquemaLogin = z.object({
    email: z.string({ error: OBRIGATORIO }).trim().toLowerCase().min(1, OBRIGATORIO),
    senha: z.string({ error: OBRIGATORIO }).min(1, OBRIGATORIO),
});

export function validarLogin(req, res, next) {
    const resultado = esquemaLogin.safeParse(req.body ?? {});

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