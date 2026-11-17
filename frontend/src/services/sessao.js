const CHAVE_TOKEN = 'financas:token';
const CHAVE_USUARIO = 'financas:usuario';

function ler(chave) {
    try {
        return localStorage.getItem(chave);
    } catch {
        return null;
    }
}

function gravar(chave, valor) {
    try {
        if (valor === null || valor === undefined) {
            localStorage.removeItem(chave);
        } else {
            localStorage.setItem(chave, valor);
        }
    } catch {
        return;
    }
}

function decodificarBase64Url(texto) {
    const base64 = texto.replace(/-/g, '+').replace(/_/g, '/');
    const completo = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return atob(completo);
}

export function tokenExpirado(token) {
    try {
        const payload = JSON.parse(decodificarBase64Url(token.split('.')[1]));
        return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
    } catch {
        return true;
    }
}

export function lerToken() {
    return ler(CHAVE_TOKEN);
}

export function lerSessao() {
    const token = lerToken();
    if (!token || tokenExpirado(token)) {
        limparSessao();
        return { token: null, usuario: null };
    }

    let usuario = null;
    try {
        usuario = JSON.parse(ler(CHAVE_USUARIO));
    } catch {
        usuario = null;
    }
    return { token, usuario };
}

export function salvarSessao(token, usuario) {
    gravar(CHAVE_TOKEN, token);
    salvarUsuario(usuario);
}

export function salvarUsuario(usuario) {
    gravar(CHAVE_USUARIO, usuario ? JSON.stringify(usuario) : null);
}

export function limparSessao() {
    gravar(CHAVE_TOKEN, null);
    gravar(CHAVE_USUARIO, null);
}