import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { lancamentosParaAnalise } from '../models/lancamento.js';
import { hojeEmSaoPaulo } from '../models/periodo.js';
import { analisarSaudeFinanceira } from '../models/saudeFinanceira.js';

const router = Router();
router.use(autenticar);

// GET /api/saude-financeira
router.get('/', async (req, res) => {
    const mesAtual = hojeEmSaoPaulo().slice(0, 7);
    const lancamentos = await lancamentosParaAnalise(req.usuarioId, mesAtual);
    return res.json(analisarSaudeFinanceira(lancamentos, mesAtual));
});

export default router;