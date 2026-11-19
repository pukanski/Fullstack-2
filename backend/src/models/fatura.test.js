import assert from 'node:assert/strict';
import test from 'node:test';
import { calcularFatura } from './fatura.js';

const nubank = { diaFechamento: 3, diaVencimento: 10 };
const visa = { diaFechamento: 25, diaVencimento: 5 };

test('Nubank: compra antes do fechamento entra na fatura do mês', () => {
    assert.deepEqual(calcularFatura('2026-11-02', nubank), { referencia: '2026-11', fechamento: '2026-11-03', vencimento: '2026-11-10' });
});

test('Nubank: compra no dia do fechamento entra na fatura do mês seguinte', () => {
    assert.deepEqual(calcularFatura('2026-11-03', nubank), { referencia: '2026-12', fechamento: '2026-12-03', vencimento: '2026-12-10' });
});

test('Visa: vencimento no mês seguinte ao fechamento e virada de ano', () => {
    assert.deepEqual(calcularFatura('2026-12-28', visa), { referencia: '2027-02', fechamento: '2027-01-25', vencimento: '2027-02-05' });
});

test('Visa: a parcela 3 cai dois meses depois da primeira', () => {
    assert.deepEqual(calcularFatura('2026-12-20', visa, 3), { referencia: '2027-03', fechamento: '2027-02-25', vencimento: '2027-03-05' });
});

test('fechamento no dia 31 é ajustado em meses curtos', () => {
    const cartao = { diaFechamento: 31, diaVencimento: 10 };
    assert.deepEqual(calcularFatura('2027-02-10', cartao), { referencia: '2027-03', fechamento: '2027-02-28', vencimento: '2027-03-10' });
});