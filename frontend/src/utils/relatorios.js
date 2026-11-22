import { fimDoMes, inicioDoMes } from './datas.js';

const NOMES_DOS_TIPOS = { renda: 'Renda', conta: 'Conta', cartao_credito: 'Cartão de crédito' };

const lista = (valor) => (Array.isArray(valor) ? valor : []);

export function periodoDoMes(referencia = new Date()) {
    return { inicio: inicioDoMes(referencia), fim: fimDoMes(referencia) };
}

export function nomeDoTipoDeFonte(tipo) {
    return NOMES_DOS_TIPOS[tipo] ?? tipo;
}

export function comPercentual(linhas) {
    const soma = linhas.reduce((total, linha) => total + linha.total, 0);
    return linhas.map((linha) => ({
        ...linha,
        percentual: soma > 0 ? Math.round((linha.total / soma) * 1000) / 10 : 0,
    }));
}

export function somaDosTotais(linhas) {
    return linhas.reduce((total, linha) => total + linha.total, 0);
}

export function maiorValor(valores) {
    return valores.reduce((maior, valor) => Math.max(maior, valor), 0);
}

export function formatarPercentual(valor) {
    return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function lerRelatorioFontes(dados) {
    return {
        periodo: {
            inicio: dados?.periodo?.inicio ?? '',
            fim: dados?.periodo?.fim ?? '',
        },
        entradas: comPercentual(lista(dados?.entradasPorFonte)),
        saidas: comPercentual(lista(dados?.saidasPorDestino)),
        contas: lista(dados?.saldoPorConta),
    };
}