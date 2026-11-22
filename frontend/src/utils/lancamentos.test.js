import assert from 'node:assert/strict';
import test from 'node:test';
import {
    categoriasDoTipo,
    errosDoPeriodo,
    filtrosDoMes,
    nomeDaCategoria,
    parametrosDaBusca,
    rotuloDaParcela,
} from './lancamentos.js';

const categorias = [
    { id: 1, nome: 'Salário', tipo: 'entrada' },
    { id: 2, nome: 'Outros', tipo: 'entrada' },
    { id: 3, nome: 'Moradia', tipo: 'saida' },
    { id: 4, nome: 'Outros', tipo: 'saida' },
];

test('filtros começam no mês atual', () => {
    assert.deepEqual(filtrosDoMes(new Date(2026, 10, 17)), {
        inicio: '2026-11-01',
        fim: '2026-11-30',
        tipo: '',
        categoriaId: '',
        fonteDestinoId: '',
    });
});

test('período pela metade ou invertido tem erro no campo certo', () => {
    assert.deepEqual(errosDoPeriodo({ inicio: '2026-11-01', fim: '2026-11-30' }), {});
    assert.deepEqual(errosDoPeriodo({ inicio: '2026-11-01', fim: '2026-11-01' }), {});
    assert.deepEqual(errosDoPeriodo({ inicio: '', fim: '' }), {});
    assert.deepEqual(errosDoPeriodo({ inicio: '2026-11-01', fim: '' }), { fim: 'Informe também a data final.' });
    assert.deepEqual(errosDoPeriodo({ inicio: '', fim: '2026-11-30' }), { inicio: 'Informe também a data inicial.' });
    assert.deepEqual(errosDoPeriodo({ inicio: '2026-11-30', fim: '2026-11-01' }), {
        inicio: 'A data inicial não pode ser depois da data final.',
    });
});

test('a busca envia só os filtros preenchidos', () => {
    assert.deepEqual(
        parametrosDaBusca({ inicio: '2026-11-01', fim: '2026-11-30', tipo: '', categoriaId: 3, fonteDestinoId: '', pagina: 2, extra: 'x' }),
        { inicio: '2026-11-01', fim: '2026-11-30', categoriaId: 3, pagina: 2 },
    );
});

test('categorias filtradas pelo tipo e nomes sem ambiguidade', () => {
    assert.deepEqual(categoriasDoTipo(categorias, 'saida').map((categoria) => categoria.id), [3, 4]);
    assert.equal(categoriasDoTipo(categorias, '').length, 4);
    assert.equal(nomeDaCategoria(categorias[1], true), 'Outros (entrada)');
    assert.equal(nomeDaCategoria(categorias[3], true), 'Outros (saída)');
    assert.equal(nomeDaCategoria(categorias[3], false), 'Outros');
});

test('rótulo da parcela', () => {
    assert.equal(rotuloDaParcela({ parcelaAtual: 3, totalParcelas: 12 }), '3/12');
    assert.equal(rotuloDaParcela({ parcelaAtual: 1, totalParcelas: 1 }), '');
});