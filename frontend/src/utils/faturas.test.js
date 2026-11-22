import assert from 'node:assert/strict';
import test from 'node:test';
import { lerFaturas, nomeDaReferencia, rotuloDaCompra } from './faturas.js';

test('nome do mês da fatura', () => {
    assert.equal(nomeDaReferencia('2026-12'), 'dezembro de 2026');
    assert.equal(nomeDaReferencia('2027-03'), 'março de 2027');
    assert.equal(nomeDaReferencia('2027-13'), '');
    assert.equal(nomeDaReferencia(undefined), '');
});

test('compra parcelada mostra a parcela, compra à vista só a descrição', () => {
    assert.equal(rotuloDaCompra({ descricao: 'Notebook', parcelaAtual: 3, totalParcelas: 10 }), 'Notebook 3/10');
    assert.equal(rotuloDaCompra({ descricao: 'Streaming', parcelaAtual: 1, totalParcelas: 1 }), 'Streaming');
});

test('lê a resposta da previsão de faturas', () => {
    const lida = lerFaturas({
        hoje: '2026-11-22',
        cartoes: [
            {
                id: 3,
                nome: 'Nubank',
                limite: 5000,
                faturas: [{ referencia: '2026-12', total: 505.9, compras: [{ lancamentoId: 1 }] }, { referencia: '2027-01' }],
            },
        ],
    });
    assert.equal(lida.hoje, '2026-11-22');
    assert.equal(lida.cartoes[0].faturas.length, 2);
    assert.equal(lida.cartoes[0].faturas[0].compras.length, 1);
    assert.deepEqual(lida.cartoes[0].faturas[1].compras, []);
    assert.deepEqual(lerFaturas({}), { hoje: '', cartoes: [] });
});