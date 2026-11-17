import api from './api.js';

export async function entrar(email, senha) {
    const { data } = await api.post('/auth/login', { email, senha });
    if (!data?.token) {
        throw new Error('A API não devolveu o token de acesso.');
    }
    return { token: data.token, usuario: data.usuario ?? null };
}

export async function cadastrar({ nome, email, cpf, senha, confirmacaoSenha }) {
    const { data } = await api.post('/auth/cadastro', { nome, email, cpf, senha, confirmacaoSenha });
    return data;
}

export async function buscarUsuarioLogado() {
    const { data } = await api.get('/auth/me');
    return data?.usuario ?? data;
}