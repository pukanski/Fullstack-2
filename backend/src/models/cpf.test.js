import assert from 'node:assert/strict';
import test from 'node:test';
import { cpfValido } from './cpf.js';

test('aceita CPFs válidos, com e sem pontuação', () => {
    assert.equal(cpfValido('529.982.247-25'), true);
    assert.equal(cpfValido('52998224725'), true);
    assert.equal(cpfValido('111.444.777-35'), true);
    assert.equal(cpfValido('11144477735'), true);
});

test('rejeita dígito verificador errado', () => {
    assert.equal(cpfValido('529.982.247-24'), false);
    assert.equal(cpfValido('11144477734'), false);
});

test('rejeita sequências repetidas', () => {
    assert.equal(cpfValido('111.111.111-11'), false);
    assert.equal(cpfValido('00000000000'), false);
});

test('rejeita tamanho errado e valores vazios', () => {
    assert.equal(cpfValido('123'), false);
    assert.equal(cpfValido('529982247250'), false);
    assert.equal(cpfValido(''), false);
    assert.equal(cpfValido(undefined), false);
});