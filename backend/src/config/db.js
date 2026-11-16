import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
});

pool.on('error', (erro) => {
    console.error('Erro inesperado no pool do banco:', erro.message);
});