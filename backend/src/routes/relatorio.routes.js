import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { validarMesesFaturas } from '../middlewares/validarMesesFaturas.js';
import { validarPeriodoRelatorio } from '../middlewares/validarPeriodoRelatorio.js';
import { relatorioPorCategoria, relatorioPorFonteDestino } from '../models/relatorio.js';
import { previsaoDeFaturas } from '../models/relatorioFaturas.js';

const router = Router();

router.use(autenticar);

// GET /api/relatorios/categorias?inicio=AAAA-MM-DD&fim=AAAA-MM-DD
router.get('/categorias', validarPeriodoRelatorio, async (req, res) => {
    return res.json(await relatorioPorCategoria(req.usuarioId, req.periodo));
});

// GET /api/relatorios/fontes-destinos?inicio=AAAA-MM-DD&fim=AAAA-MM-DD
router.get('/fontes-destinos', validarPeriodoRelatorio, async (req, res) => {
    return res.json(await relatorioPorFonteDestino(req.usuarioId, req.periodo));
});

router.get('/faturas', validarMesesFaturas, async (req, res) => {
    return res.json(await previsaoDeFaturas(req.usuarioId, req.meses));
});

export default router;