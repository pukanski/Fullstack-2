import { calcularFatura } from './fatura.js';

const emCentavos = (valor) => Math.round(valor * 100);

export function faturasDoCartao(cartao, hoje, quantidade) {
    const anterior = calcularFatura(hoje, cartao, 0);
    const primeira = anterior.vencimento >= hoje ? 0 : 1;

    return Array.from({ length: quantidade }, (_, indice) => {
        const fatura = calcularFatura(hoje, cartao, primeira + indice);
        return { ...fatura, situacao: hoje >= fatura.fechamento ? 'fechada' : 'aberta' };
    });
}

export function montarPrevisaoDeFaturas({ cartoes, compras, hoje, quantidade }) {
    return {
        hoje,
        cartoes: cartoes.map((cartao) => {
            const faturas = faturasDoCartao(cartao, hoje, quantidade).map((fatura) => ({ ...fatura, centavos: 0, compras: [] }));
            const porReferencia = new Map(faturas.map((fatura) => [fatura.referencia, fatura]));

            for (const compra of compras.filter((item) => item.cartaoId === cartao.id)) {
                const fatura = porReferencia.get(calcularFatura(compra.data, cartao, compra.parcelaAtual).referencia);
                if (fatura) {
                    fatura.centavos += emCentavos(compra.valor);
                    fatura.compras.push({
                        lancamentoId: compra.lancamentoId,
                        descricao: compra.descricao,
                        data: compra.data,
                        parcelaAtual: compra.parcelaAtual,
                        totalParcelas: compra.totalParcelas,
                        valor: compra.valor,
                    });
                }
            }

            return {
                id: cartao.id,
                nome: cartao.nome,
                limite: cartao.limite,
                diaFechamento: cartao.diaFechamento,
                diaVencimento: cartao.diaVencimento,
                faturas: faturas.map(({ centavos, ...fatura }) => ({ ...fatura, total: centavos / 100 })),
            };
        }),
    };
}