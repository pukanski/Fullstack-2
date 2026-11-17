import assert from 'node:assert/strict';
import test from 'node:test';
import { esquemaLancamento } from './validarLancamento.js';

const valido = {
    tipo: 'saida',
    descricao: '  Mercado ',
    valor: 19.9,
    data: '2026-11-16',
    categoriaId: 3,
    fonteDestinoId: 1,
};

function camposComErro(corpo) {
    const resultado = esquemaLancamento.safeParse(corpo);
    assert.equal(resultado.success, false);
    return [...new Set(resultado.error.issues.map((problema) => problema.path[0]))].sort();
}

test('dados válidos são aceitos e normalizados (parcelas padrão = 1)', () => {
    const resultado = esquemaLancamento.safeParse(valido);
    assert.equal(resultado.success, true);
    assert.deepEqual(resultado.data, {
        tipo: 'saida',
        descricao: 'Mercado',
        valor: 19.9,
        data: '2026-11-16',
        categoriaId: 3,
        fonteDestinoId: 1,
        parcelas: 1,
    });
});

test('aceita números escritos como texto (formulários)', () => {
    const resultado = esquemaLancamento.safeParse({ ...valido, valor: '19.90', categoriaId: '3', fonteDestinoId: '1', parcelas: '2' });
    assert.equal(resultado.success, true);
    assert.equal(resultado.data.valor, 19.9);
    assert.equal(resultado.data.categoriaId, 3);
    assert.equal(resultado.data.parcelas, 2);
});

test('corpo vazio reprova todos os campos obrigatórios', () => {
    assert.deepEqual(camposComErro({}), ['categoriaId', 'data', 'descricao', 'fonteDestinoId', 'tipo', 'valor']);
});

test('tipo diferente de entrada e saida é reprovado', () => {
    assert.deepEqual(camposComErro({ ...valido, tipo: 'despesa' }), ['tipo']);
});

test('valor zero, negativo, com 3 casas ou que não é número é reprovado', () => {
    for (const valor of [0, -5, 10.123, 'abc', '10,50', null, 1e-9]) {
        assert.deepEqual(camposComErro({ ...valido, valor }), ['valor'], `valor ${String(valor)}`);
    }
});

test('valor com centavos quebrados é arredondado para 2 casas', () => {
    const resultado = esquemaLancamento.safeParse({ ...valido, valor: 0.1 + 0.2 });
    assert.equal(resultado.success, true);
    assert.equal(resultado.data.valor, 0.3);
});

test('data inexistente ou em outro formato é reprovada', () => {
    for (const data of ['2026-02-30', '16/11/2026', '2026-13-01', '', 20261116]) {
        assert.deepEqual(camposComErro({ ...valido, data }), ['data'], `data ${String(data)}`);
    }
});

test('ids inválidos são reprovados', () => {
    assert.deepEqual(camposComErro({ ...valido, categoriaId: 0, fonteDestinoId: 'abc' }), ['categoriaId', 'fonteDestinoId']);
    assert.deepEqual(camposComErro({ ...valido, categoriaId: 99999999999 }), ['categoriaId']);
});

test('parcelas fora de 1 a 48 são reprovadas', () => {
    for (const parcelas of [0, 49, 1.5, 'x']) {
        assert.deepEqual(camposComErro({ ...valido, parcelas }), ['parcelas'], `parcelas ${String(parcelas)}`);
    }
});

test('campos extras, como usuarioId, são descartados', () => {
    const resultado = esquemaLancamento.safeParse({ ...valido, usuarioId: 999, id: 5 });
    assert.equal(resultado.success, true);
    assert.equal('usuarioId' in resultado.data, false);
    assert.equal('id' in resultado.data, false);
});

test('valor pequeno demais para o número de parcelas é reprovado', () => {
    assert.deepEqual(camposComErro({ ...valido, valor: 0.05, parcelas: 10 }), ['parcelas']);
    const resultado = esquemaLancamento.safeParse({ ...valido, valor: 0.1, parcelas: 10 });
    assert.equal(resultado.success, true); // 10 centavos em 10 parcelas: 1 centavo cada
});