import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { ErroHttp } from '../middlewares/erros.js';
import { validarCategoria } from '../middlewares/validarCategoria.js';
import { validarId } from '../middlewares/validarId.js';
import { atualizarCategoria, criarCategoria, excluirCategoria, listarCategorias } from '../models/categoria.js';

const router = Router();

router.use(autenticar);

const naoEncontrada = () => new ErroHttp(404, 'Categoria não encontrada.');

// GET /api/categorias
router.get('/', async (req, res) => {
    return res.json(await listarCategorias(req.usuarioId));
});

// POST /api/categorias
router.post('/', validarCategoria, async (req, res) => {
    return res.status(201).json(await criarCategoria(req.usuarioId, req.body));
});

// PUT /api/categorias/:id
router.put('/:id', validarId, validarCategoria, async (req, res) => {
    const categoria = await atualizarCategoria(req.usuarioId, req.recursoId, req.body);
    if (!categoria) throw naoEncontrada();
    return res.json(categoria);
});

// DELETE /api/categorias/:id
router.delete('/:id', validarId, async (req, res) => {
    if (!(await excluirCategoria(req.usuarioId, req.recursoId))) throw naoEncontrada();
    return res.status(204).end();
});

export default router;