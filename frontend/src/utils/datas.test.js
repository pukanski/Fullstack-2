import assert from 'node:assert/strict';
import test from 'node:test';
import { fimDoMes, hojeISO, inicioDoMes } from './datas.js';

test('data de hoje no formato da API', () => {
    assert.equal(hojeISO(new Date(2026, 10, 17)), '2026-11-17');
    assert.equal(hojeISO(new Date(2026, 0, 5)), '2026-01-05');
});

test('primeiro e último dia do mês', () => {
    assert.equal(inicioDoMes(new Date(2026, 10, 17)), '2026-11-01');
    assert.equal(fimDoMes(new Date(2026, 10, 17)), '2026-11-30');
    assert.equal(fimDoMes(new Date(2026, 11, 31)), '2026-12-31');
    assert.equal(fimDoMes(new Date(2027, 1, 10)), '2027-02-28');
    assert.equal(fimDoMes(new Date(2028, 1, 10)), '2028-02-29');
});