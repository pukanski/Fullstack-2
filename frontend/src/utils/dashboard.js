const lista = (valor) => (Array.isArray(valor) ? valor : []);

export function primeiroNome(nome) {
    return String(nome ?? '').trim().split(/\s+/)[0];
}

export function principaisCategorias(relatorio, quantidade = 5) {
    return lista(relatorio?.saidas?.categorias)
        .filter((categoria) => categoria.total > 0)
        .sort((a, b) => b.total - a.total)
        .slice(0, quantidade);
}

export function proximasFaturas(cartoes) {
    return cartoes
        .filter((cartao) => cartao.faturas.length > 0)
        .map((cartao) => ({ cartaoId: cartao.id, cartao: cartao.nome, ...cartao.faturas[0] }))
        .sort((a, b) => a.vencimento.localeCompare(b.vencimento) || a.cartao.localeCompare(b.cartao));
}