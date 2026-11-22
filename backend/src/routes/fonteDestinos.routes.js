import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { ErroHttp } from '../middlewares/erros.js';
import { validarFonteDestino } from '../middlewares/validarFonteDestino.js';
import { validarId } from '../middlewares/validarId.js';
import {
    atualizarFonteDestino, criarFonteDestino, excluirFonteDestino, listarFontesDestinos,
} from '../models/fonteDestino.js';

const router = Router();

router.use(autenticar);

const naoEncontrada = () => new ErroHttp(404, 'Fonte/destino não encontrada.');

// GET /api/fontes-destinos
router.get('/', async (req, res) => {
    return res.json(await listarFontesDestinos(req.usuarioId));
});

// POST /api/fontes-destinos
router.post('/', validarFonteDestino, async (req, res) => {
    return res.status(201).json(await criarFonteDestino(req.usuarioId, req.body));
});

// PUT /api/fontes-destinos/:id
router.put('/:id', validarId, validarFonteDestino, async (req, res) => {
    const fonte = await atualizarFonteDestino(req.usuarioId, req.recursoId, req.body);
    if (!fonte) throw naoEncontrada();
    return res.json(fonte);
});

// DELETE /api/fontes-destinos/:id
router.delete('/:id', validarId, async (req, res) => {
    if (!(await excluirFonteDestino(req.usuarioId, req.recursoId))) throw naoEncontrada();
    return res.status(204).end();
});

export default router;