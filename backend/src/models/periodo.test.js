import assert from 'node:assert/strict';
import test from 'node:test';
import { hojeEmSaoPaulo, mesCorrente } from './periodo.js';

test('mês corrente no meio do mês', () => {
    assert.deepEqual(mesCorrente(new Date('2026-11-17T15:00:00Z')), { inicio: '2026-11-01', fim: '2026-11-30' });
});

test('usa o fuso de São Paulo: 01:00 UTC do dia 1º ainda é o mês anterior no Brasil', () => {
    assert.equal(hojeEmSaoPaulo(new Date('2026-12-01T01:00:00Z')), '2026-11-30');
    assert.deepEqual(mesCorrente(new Date('2026-12-01T01:00:00Z')), { inicio: '2026-11-01', fim: '2026-11-30' });
});

test('fevereiro de ano comum e de ano bissexto', () => {
    assert.equal(mesCorrente(new Date('2027-02-10T12:00:00Z')).fim, '2027-02-28');
    assert.equal(mesCorrente(new Date('2028-02-10T12:00:00Z')).fim, '2028-02-29');
});

test('meses de 31 dias e virada de ano', () => {
    assert.deepEqual(mesCorrente(new Date('2026-12-15T12:00:00Z')), { inicio: '2026-12-01', fim: '2026-12-31' });
    assert.deepEqual(mesCorrente(new Date('2027-01-01T02:00:00Z')), { inicio: '2026-12-01', fim: '2026-12-31' });
});