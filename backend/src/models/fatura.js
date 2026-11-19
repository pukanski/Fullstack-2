function ultimoDiaDoMesNumerico(ano, mes) {
    return new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
}

function dataSegura(ano, mes, dia) {
    const anoCerto = ano + Math.floor(mes / 12);
    const mesCerto = ((mes % 12) + 12) % 12;
    return new Date(Date.UTC(anoCerto, mesCerto, Math.min(dia, ultimoDiaDoMesNumerico(anoCerto, mesCerto))));
}

export function calcularFatura(dataCompra, cartao, numeroParcela = 1) {
    const [ano, mes, dia] = dataCompra.split('-').map(Number);
    const mesDaCompra = mes - 1;
    const fechamentoDoMes = Math.min(cartao.diaFechamento, ultimoDiaDoMesNumerico(ano, mesDaCompra));

    let mesFechamento = dia < fechamentoDoMes ? mesDaCompra : mesDaCompra + 1;
    mesFechamento += numeroParcela - 1;

    const fechamento = dataSegura(ano, mesFechamento, cartao.diaFechamento);

    const mesVencimento = cartao.diaVencimento > cartao.diaFechamento ? mesFechamento : mesFechamento + 1;
    const vencimento = dataSegura(ano, mesVencimento, cartao.diaVencimento);

    const iso = (data) => data.toISOString().slice(0, 10);
    return {
        referencia: iso(vencimento).slice(0, 7),
        fechamento: iso(fechamento),
        vencimento: iso(vencimento),
    };
}