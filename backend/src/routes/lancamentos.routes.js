import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { ErroHttp } from '../middlewares/erros.js';
import { validarFiltrosLancamentos } from '../middlewares/validarFiltrosLancamentos.js';
import { validarLancamento } from '../middlewares/validarLancamento.js';
import { buscarReferencias, criarLancamentos, listarLancamentos } from '../models/lancamento.js';

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

    if (dados.parcelas > 1) {
        if (dados.tipo !== 'saida') {
            throw new ErroHttp(400, 'Dados inválidos.', { parcelas: 'Só saídas podem ser parceladas.' });
        }
        if (fonte.tipo !== 'cartao_credito') {
            throw new ErroHttp(400, 'Dados inválidos.', { parcelas: 'Só compras no cartão de crédito podem ser parceladas.' });
        }
    }

    const criados = await criarLancamentos(req.usuarioId, dados);
    const [primeira] = criados;

    if (criados.length === 1) {
        return res.status(201).json(primeira);
    }
    return res.status(201).json({
        ...primeira,
        parcelasCriadas: criados.map(({ id, parcelaAtual, valor }) => ({ id, parcelaAtual, valor })),
    });
});

router.get('/', validarFiltrosLancamentos, async (req, res) => {
    const resultado = await listarLancamentos(req.usuarioId, req.filtros);
    return res.json(resultado);
});

export default router;