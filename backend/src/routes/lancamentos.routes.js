import { Router } from 'express';
import { autenticar } from '../middlewares/autenticar.js';
import { ErroHttp } from '../middlewares/erros.js';
import { validarFiltrosLancamentos } from '../middlewares/validarFiltrosLancamentos.js';
import { validarId } from '../middlewares/validarId.js';
import { validarLancamento } from '../middlewares/validarLancamento.js';
import {
    atualizarLancamento,
    buscarLancamentoPorId,
    buscarReferencias,
    criarLancamentos,
    excluirLancamento,
    listarLancamentos,
} from '../models/lancamento.js';

const router = Router();

router.use(autenticar);

const nomeDoTipo = (tipo) => (tipo === 'saida' ? 'saída' : 'entrada');
const naoEncontrado = () => new ErroHttp(404, 'Lançamento não encontrado.');

async function validarReferencias(usuarioId, dados) {
    const { categoria, fonte } = await buscarReferencias(usuarioId, dados.categoriaId, dados.fonteDestinoId);

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

    return { categoria, fonte };
}

// POST /api/lancamentos
router.post('/', validarLancamento, async (req, res) => {
    const dados = req.body;
    const { fonte } = await validarReferencias(req.usuarioId, dados);

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

// GET /api/lancamentos
router.get('/', validarFiltrosLancamentos, async (req, res) => {
    const resultado = await listarLancamentos(req.usuarioId, req.filtros);
    return res.json(resultado);
});

// PUT /api/lancamentos/:id
router.put('/:id', validarId, validarLancamento, async (req, res) => {
    const dados = req.body;
    const atual = await buscarLancamentoPorId(req.usuarioId, req.recursoId);
    if (!atual) throw naoEncontrado();

    const { fonte } = await validarReferencias(req.usuarioId, dados);

    if (atual.totalParcelas > 1) {
        if (dados.tipo !== atual.tipo) {
            throw new ErroHttp(400, 'Dados inválidos.', {
                tipo: 'Não é possível alterar o tipo de um lançamento parcelado.',
            });
        }
        if (fonte.tipo !== 'cartao_credito') {
            throw new ErroHttp(400, 'Dados inválidos.', {
                fonteDestinoId: 'Lançamentos parcelados devem pertencer a um cartão de crédito.',
            });
        }
    }

    const atualizado = await atualizarLancamento(req.usuarioId, req.recursoId, dados);
    if (!atualizado) throw naoEncontrado();
    return res.json(atualizado);
});

// DELETE /api/lancamentos/:id com (?todasParcelas=true)
router.delete('/:id', validarId, async (req, res) => {
    const todasParcelas = req.query.todasParcelas === 'true';
    if (!(await excluirLancamento(req.usuarioId, req.recursoId, todasParcelas))) {
        throw naoEncontrado();
    }
    return res.status(204).end();
});

// GET /api/lancamentos/:id
router.get('/:id', validarId, async (req, res) => {
    const lancamento = await buscarLancamentoPorId(req.usuarioId, req.recursoId);
    if (!lancamento) throw naoEncontrado();
    return res.json(lancamento);
});

export default router;