import assert from 'node:assert/strict';
import test from 'node:test';
import { deslocarMes, nomeDoMes, ultimoDiaDoMes } from './meses.js';

test('deslocarMes soma e subtrai meses, inclusive na virada de ano', () => {
    assert.equal(deslocarMes('2026-11', 0), '2026-11');
    assert.equal(deslocarMes('2026-11', 1), '2026-12');
    assert.equal(deslocarMes('2026-11', 3), '2027-02');
    assert.equal(deslocarMes('2026-01', -1), '2025-12');
    assert.equal(deslocarMes('2026-11', -3), '2026-08');
    assert.equal(deslocarMes('2026-02', -51), '2021-11');
});

test('ultimoDiaDoMes considera ano bissexto', () => {
    assert.equal(ultimoDiaDoMes('2026-11'), 30);
    assert.equal(ultimoDiaDoMes('2026-12'), 31);
    assert.equal(ultimoDiaDoMes('2027-02'), 28);
    assert.equal(ultimoDiaDoMes('2028-02'), 29);
});

test('nomeDoMes escreve o mês por extenso em português', () => {
    assert.equal(nomeDoMes('2026-12'), 'dezembro de 2026');
    assert.equal(nomeDoMes('2027-03'), 'março de 2027');
});