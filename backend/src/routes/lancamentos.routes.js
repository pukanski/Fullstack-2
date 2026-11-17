import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { ErroHttp } from '../middlewares/erros.js';
import { validarLancamento } from '../middlewares/validarLancamento.js';
import { buscarReferencias, criarLancamento } from '../models/lancamento.js';

const router = Router();

router.use(autenticar);

const nomeDoTipo = (tipo) => (tipo === 'saida' ? 'saída' : 'entrada');

// POST /api/lancamentos
router.post('/', validarLancamento, async (req, res) => {
    const dados = req.body;

    const { categoria, fonte } = await buscarReferencias(req.usuarioId, dados.categoriaId, dados.fonteDestinoId);

    const naoEncontrados = {};
    if (!categoria) naoEncontrados.categoriaId = 'Categoria não encontrada.';
    if (!fonte) naoEncontrados.fonteDestinoId = 'Fonte/destino não encontrada.';
    if (Object.keys(naoEncontrados).length > 0) {
        throw new ErroHttp(404, 'Registro não encontrado.', naoEncontrados);
    }

    if (categoria.tipo !== dados.tipo) {
        throw new ErroHttp(400, 'Dados inválidos.', {
            categoriaId: `A categoria informada é de ${nomeDoTipo(categoria.tipo)}, mas o lançamento é de ${nomeDoTipo(dados.tipo)}.`,
        });
    }

    // esse aqui é temporario, o parcelamento entra na issue #18. Até lá, recusa em vez de gravar errado.
    if (dados.parcelas > 1) {
        throw new ErroHttp(400, 'Dados inválidos.', {
            parcelas: 'Compras parceladas ainda não estão disponíveis.',
        });
    }

    const lancamento = await criarLancamento(req.usuarioId, dados);
    return res.status(201).json(lancamento);
});

export default router;