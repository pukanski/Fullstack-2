import assert from 'node:assert/strict';
import test from 'node:test';
import { primeiroNome, principaisCategorias, proximasFaturas } from './dashboard.js';

test('primeiro nome do usuário', () => {
    assert.equal(primeiroNome('Ana Demonstração'), 'Ana');
    assert.equal(primeiroNome('  Bruno  '), 'Bruno');
    assert.equal(primeiroNome(undefined), '');
});

test('principais categorias de saída do mês, da maior para a menor', () => {
    const relatorio = {
        saidas: {
            categorias: [
                { categoriaId: 1, nome: 'Lazer', total: 55.9 },
                { categoriaId: 2, nome: 'Moradia', total: 1500 },
                { categoriaId: 3, nome: 'Saúde', total: 0 },
                { categoriaId: 4, nome: 'Alimentação', total: 1120 },
            ],
        },
    };
    assert.deepEqual(principaisCategorias(relatorio).map((categoria) => categoria.nome), ['Moradia', 'Alimentação', 'Lazer']);
    assert.equal(principaisCategorias(relatorio, 1).length, 1);
    assert.deepEqual(principaisCategorias({}), []);
});

test('próxima fatura de cada cartão, da que vence primeiro', () => {
    const cartoes = [
        { id: 3, nome: 'Nubank', faturas: [{ referencia: '2026-12', vencimento: '2026-12-10', total: 505.9 }] },
        { id: 4, nome: 'Visa', faturas: [{ referencia: '2026-12', vencimento: '2026-12-05', total: 120 }] },
        { id: 5, nome: 'Sem faturas', faturas: [] },
    ];
    const proximas = proximasFaturas(cartoes);
    assert.deepEqual(proximas.map((fatura) => fatura.cartao), ['Visa', 'Nubank']);
    assert.equal(proximas[0].total, 120);
    assert.equal(proximas[0].cartaoId, 4);
    assert.deepEqual(proximasFaturas([]), []);
});