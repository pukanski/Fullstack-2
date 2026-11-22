import { ErroHttp } from './erros.js';

export function validarId(req, res, next) {
    const id = /^\d+$/.test(req.params.id) ? Number(req.params.id) : NaN;

    if (!Number.isInteger(id) || id < 1 || id > 2147483647) {
        throw new ErroHttp(400, 'Identificador inválido.', { id: 'Informe um valor válido.' });
    }

    req.recursoId = id;
    next();
}