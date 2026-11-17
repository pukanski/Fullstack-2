import jwt from 'jsonwebtoken';
import { JWT_ALGORITMO, JWT_SECRET } from '../config/jwt.js';
import { ErroHttp } from './erros.js';

export function autenticar(req, res, next) {
    const [esquema, token] = (req.headers.authorization ?? '').split(' ');

    if (esquema?.toLowerCase() !== 'bearer' || !token) {
        throw new ErroHttp(401, 'Token não informado.');
    }

    let payload;
    try {
        payload = jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITMO] });
    } catch (erro) {
        if (erro.name === 'TokenExpiredError') {
            throw new ErroHttp(401, 'Sessão expirada. Faça login novamente.');
        }
        throw new ErroHttp(401, 'Token inválido.');
    }

    const usuarioId = Number(payload.sub);
    if (!Number.isInteger(usuarioId)) {
        throw new ErroHttp(401, 'Token inválido.');
    }

    req.usuarioId = usuarioId;
    next();
}