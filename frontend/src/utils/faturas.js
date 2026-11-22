const MESES = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const lista = (valor) => (Array.isArray(valor) ? valor : []);

export function nomeDaReferencia(referencia) {
    const [ano, mes] = String(referencia ?? '').split('-').map(Number);
    if (!ano || !(mes >= 1 && mes <= 12)) {
        return '';
    }
    return `${MESES[mes - 1]} de ${ano}`;
}

export function rotuloDaCompra({ descricao, parcelaAtual, totalParcelas }) {
    return totalParcelas > 1 ? `${descricao} ${parcelaAtual}/${totalParcelas}` : descricao;
}

export function lerFaturas(dados) {
    return {
        hoje: dados?.hoje ?? '',
        cartoes: lista(dados?.cartoes).map((cartao) => ({
            ...cartao,
            faturas: lista(cartao.faturas).map((fatura) => ({ ...fatura, compras: lista(fatura.compras) })),
        })),
    };
}