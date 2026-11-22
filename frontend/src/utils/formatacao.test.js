import assert from 'node:assert/strict';
import test from 'node:test';
import { formatarData, formatarMoeda, formatarPercentual, mascararValor, numeroParaValor, valorParaNumero } from './formatacao.js';

const semEspacoFixo = (texto) => texto.replace(/\u00a0/g, ' ');

test('valores em reais no formato brasileiro', () => {
    assert.equal(semEspacoFixo(formatarMoeda(1234.56)), 'R$ 1.234,56');
    assert.equal(semEspacoFixo(formatarMoeda(55.9)), 'R$ 55,90');
    assert.equal(semEspacoFixo(formatarMoeda(0)), 'R$ 0,00');
    assert.equal(semEspacoFixo(formatarMoeda(-1500)), '-R$ 1.500,00');
    assert.equal(semEspacoFixo(formatarMoeda('4200')), 'R$ 4.200,00');
    assert.equal(formatarMoeda(null), '');
    assert.equal(formatarMoeda('abc'), '');
});

test('datas no formato brasileiro sem erro de fuso horário', () => {
    assert.equal(formatarData('2026-11-17'), '17/11/2026');
    assert.equal(formatarData('2026-01-01'), '01/01/2026');
    assert.equal(formatarData('2026-03-31T00:00:00.000Z'), '31/03/2026');
    assert.equal(formatarData(''), '');
    assert.equal(formatarData(null), '');
    assert.equal(formatarData('17/11/2026'), '');
});

test('máscara do campo de valor enquanto digita', () => {
    assert.equal(mascararValor(''), '');
    assert.equal(mascararValor('1'), '0,01');
    assert.equal(mascararValor('12'), '0,12');
    assert.equal(mascararValor('123'), '1,23');
    assert.equal(mascararValor('123456'), '1.234,56');
    assert.equal(mascararValor('0,001'), '0,01');
    assert.equal(mascararValor('1.234,567'), '12.345,67');
    assert.equal(mascararValor('R$ 10,00'), '10,00');
    assert.equal(mascararValor('0,0'), '');
    assert.equal(mascararValor('9999999999999'), '9.999.999.999,99');
});

test('conversão entre o campo de valor e o número enviado para a API', () => {
    assert.equal(valorParaNumero('1.234,56'), 1234.56);
    assert.equal(valorParaNumero('0,01'), 0.01);
    assert.equal(valorParaNumero('55,90'), 55.9);
    assert.equal(valorParaNumero(''), null);
    assert.equal(valorParaNumero('0,00'), null);
    assert.equal(numeroParaValor(1234.56), '1.234,56');
    assert.equal(numeroParaValor(55.9), '55,90');
    assert.equal(numeroParaValor(1500), '1.500,00');
    assert.equal(numeroParaValor(null), '');
    assert.equal(numeroParaValor(0), '');
});

test('percentual no formato brasileiro', () => {
    assert.equal(formatarPercentual(35.24), '35,2%');
    assert.equal(formatarPercentual(100), '100,0%');
    assert.equal(formatarPercentual(0), '0,0%');
    assert.equal(formatarPercentual(null), '');
});