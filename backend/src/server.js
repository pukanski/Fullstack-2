import 'dotenv/config';
import express from 'express';
import { corsRestrito } from './middlewares/cors.js';
import { rotaNaoEncontrada, tratarErros } from './middlewares/erros.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(corsRestrito);
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use(rotaNaoEncontrada);
app.use(tratarErros);

app.listen(PORT, '0.0.0.0', (erro) => {
    if (erro) {
        console.error('Não foi possível iniciar a API:', erro.message);
        process.exit(1);
    }
    console.log(`API rodando na porta ${PORT}`);
});