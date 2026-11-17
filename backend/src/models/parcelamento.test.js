import assert from 'node:assert/strict';
import test from 'node:test';
import { dividirEmCentavos } from './parcelamento.js';

test('exemplo do enunciado: R$ 100,00 em 3x', () => {
    assert.deepEqual(dividirEmCentavos(100, 3), [33.34, 33.33, 33.33]);
});

test('divisão exata não gera diferença', () => {
    assert.deepEqual(dividirEmCentavos(3600, 12), Array(12).fill(300));
    assert.deepEqual(dividirEmCentavos(19.9, 1), [19.9]);
});

test('a diferença do arredondamento vai toda para a primeira parcela', () => {
    assert.deepEqual(dividirEmCentavos(10, 3), [3.34, 3.33, 3.33]);
    assert.deepEqual(dividirEmCentavos(19.9, 4), [4.99, 4.97, 4.97, 4.97]);
});

test('a soma das parcelas é sempre exatamente o valor total', () => {
    for (const valor of [0.01, 0.1, 19.9, 99.99, 100, 1234.56, 4500, 9999999.99]) {
        for (const parcelas of [1, 2, 3, 7, 10, 12, 48]) {
            if (Math.round(valor * 100) < parcelas) continue;
            const partes = dividirEmCentavos(valor, parcelas);
            const somaEmCentavos = partes.reduce((soma, parte) => soma + Math.round(parte * 100), 0);
            assert.equal(partes.length, parcelas);
            assert.equal(somaEmCentavos, Math.round(valor * 100), `${valor} em ${parcelas}x`);
            assert.ok(partes.every((parte) => parte >= 0.01), `${valor} em ${parcelas}x tem parcela zerada`);
        }
    }
});