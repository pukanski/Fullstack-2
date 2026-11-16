import cors from 'cors';

const origensPermitidas = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((origem) => origem.trim())
    .filter(Boolean);

export const corsRestrito = cors({
    origin(origem, callback) {
        if (!origem || origensPermitidas.includes(origem)) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
});