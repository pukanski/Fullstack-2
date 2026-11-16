import { rateLimit } from 'express-rate-limit';

export const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler(req, res) {
        res.status(429).json({
            erro: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
            campos: {},
        });
    },
});