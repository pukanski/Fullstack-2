import assert from 'node:assert/strict';
import test from 'node:test';
import { cpfValido, mascararCpf, validarCadastro, validarLogin } from './validacao.js';

const valido = {
    nome: 'Ana Silva',
    email: 'ana@email.com',
    cpf: '529.982.247-25',
    senha: 'senha123',
    confirmacaoSenha: 'senha123',
};

test('máscara de CPF formata enquanto digita', () => {
    assert.equal(mascararCpf(''), '');
    assert.equal(mascararCpf('529'), '529');
    assert.equal(mascararCpf('5299'), '529.9');
    assert.equal(mascararCpf('5299822'), '529.982.2');
    assert.equal(mascararCpf('529982247'), '529.982.247');
    assert.equal(mascararCpf('5299822472'), '529.982.247-2');
    assert.equal(mascararCpf('52998224725'), '529.982.247-25');
    assert.equal(mascararCpf('529.982.247-25999'), '529.982.247-25');
    assert.equal(mascararCpf('abc529x982'), '529.982');
});

test('CPF com dígitos verificadores', () => {
    assert.equal(cpfValido('529.982.247-25'), true);
    assert.equal(cpfValido('52998224724'), false);
    assert.equal(cpfValido('111.111.111-11'), false);
    assert.equal(cpfValido('5299822472'), false);
});

test('cadastro válido não tem erros', () => {
    assert.deepEqual(validarCadastro(valido), {});
});

test('cadastro vazio reprova todos os campos', () => {
    assert.deepEqual(Object.keys(validarCadastro({})).sort(), ['confirmacaoSenha', 'cpf', 'email', 'nome', 'senha']);
});

test('mensagens iguais às do back-end', () => {
    const erros = validarCadastro({ ...valido, email: 'sem-arroba', cpf: '529.982.247-24', senha: 'abcdefgh', confirmacaoSenha: 'x' });
    assert.equal(erros.email, 'E-mail inválido.');
    assert.equal(erros.cpf, 'CPF inválido.');
    assert.equal(erros.senha, 'A senha deve conter letras e números.');
    assert.equal(erros.confirmacaoSenha, 'As senhas não conferem.');
    assert.equal(validarCadastro({ ...valido, senha: 'abc1', confirmacaoSenha: 'abc1' }).senha, 'A senha deve ter no mínimo 8 caracteres.');
    const longa = 'a1'.repeat(37);
    assert.equal(validarCadastro({ ...valido, senha: longa, confirmacaoSenha: longa }).senha, 'A senha deve ter no máximo 72 caracteres.');
});

test('login exige e-mail válido e senha', () => {
    assert.deepEqual(validarLogin({ email: 'ana@email.com', senha: 'x' }), {});
    assert.deepEqual(Object.keys(validarLogin({ email: 'ana', senha: '' })).sort(), ['email', 'senha']);
});