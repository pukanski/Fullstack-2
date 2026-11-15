import 'dotenv/config';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', (erro) => {
    if (erro) {
        console.error('Não foi possível iniciar a API:', erro.message);
        process.exit(1);
    }
    console.log(`API rodando na porta ${PORT}`);
});