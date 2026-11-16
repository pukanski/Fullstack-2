import assert from 'node:assert/strict';
import test from 'node:test';
import { esquemaCadastro } from './validarCadastro.js';

const valido = {
    nome: '  Ana Silva ',
    email: '  Ana@Email.COM ',
    cpf: '529.982.247-25',
    senha: 'senha123',
    confirmacaoSenha: 'senha123',
};

function camposComErro(corpo) {
    const resultado = esquemaCadastro.safeParse(corpo);
    assert.equal(resultado.success, false);
    return [...new Set(resultado.error.issues.map((problema) => problema.path[0]))].sort();
}

test('dados válidos são aceitos e normalizados', () => {
    const resultado = esquemaCadastro.safeParse(valido);
    assert.equal(resultado.success, true);
    assert.deepEqual(resultado.data, {
        nome: 'Ana Silva',
        email: 'ana@email.com',
        cpf: '52998224725',
        senha: 'senha123',
    });
});

test('corpo vazio reprova todos os campos', () => {
    assert.deepEqual(camposComErro({}), ['confirmacaoSenha', 'cpf', 'email', 'nome', 'senha']);
});

test('e-mail e CPF inválidos reprovam só esses campos', () => {
    assert.deepEqual(camposComErro({ ...valido, email: 'sem-arroba', cpf: '529.982.247-24' }), ['cpf', 'email']);
});

test('senha curta, só com letras ou só com números é reprovada', () => {
    for (const senha of ['abc123', 'abcdefgh', '12345678']) {
        assert.deepEqual(camposComErro({ ...valido, senha, confirmacaoSenha: senha }), ['senha']);
    }
});

test('senha com mais de 72 bytes é reprovada', () => {
    const longa = 'a1'.repeat(37);
    assert.deepEqual(camposComErro({ ...valido, senha: longa, confirmacaoSenha: longa }), ['senha']);
});

test('confirmação diferente da senha é reprovada', () => {
    assert.deepEqual(camposComErro({ ...valido, confirmacaoSenha: 'outra1234' }), ['confirmacaoSenha']);
});

test('campos extras são descartados', () => {
    const resultado = esquemaCadastro.safeParse({ ...valido, id: 1, senha_hash: 'x' });
    assert.equal(resultado.success, true);
    assert.equal('id' in resultado.data, false);
    assert.equal('senha_hash' in resultado.data, false);
});