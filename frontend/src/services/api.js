import axios from 'axios';
import { lerToken, limparSessao } from './sessao.js';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    timeout: 15000,
});

let aoSessaoExpirar = null;

export function definirAoSessaoExpirar(callback) {
    aoSessaoExpirar = callback;
    return () => {
        if (aoSessaoExpirar === callback) {
            aoSessaoExpirar = null;
        }
    };
}

api.interceptors.request.use((config) => {
    const token = lerToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (resposta) => resposta,
    (erro) => {
        const enviouToken = Boolean(erro.config?.headers?.Authorization);

        if (erro.response?.status === 401 && enviouToken) {
            limparSessao();
            if (aoSessaoExpirar) {
                aoSessaoExpirar();
            } else if (window.location.pathname !== '/login') {
                window.location.assign('/login');
            }
        }

        return Promise.reject(erro);
    },
);

export function extrairErroApi(erro, mensagemPadrao = 'Não foi possível concluir a operação.') {
    if (erro?.response) {
        const dados = erro.response.data ?? {};
        return {
            status: erro.response.status,
            mensagem: typeof dados.erro === 'string' && dados.erro ? dados.erro : mensagemPadrao,
            campos: dados.campos && typeof dados.campos === 'object' ? dados.campos : {},
        };
    }

    if (erro?.request) {
        return {
            status: null,
            mensagem: 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.',
            campos: {},
        };
    }

    return { status: null, mensagem: mensagemPadrao, campos: {} };
}

export default api;