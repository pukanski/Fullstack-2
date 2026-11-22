import { calcularFatura } from './fatura.js';
import { deslocarMes, nomeDoMes } from './meses.js';

//esses são os imites adotados pelo grupo que estão lá nmo README
const LIMITES = {
    poupancaMinima: 10,
    cartaoSaudavel: 30,
    cartaoCritico: 50,
    parcelaPesada: 30,
    foraDaCurva: 30,
    mediaMinimaCategoria: 50,
};
const MAXIMO_DE_DICAS = 5;
const ORDEM_DAS_FAIXAS = ['critico', 'atencao', 'informativo', 'saudavel'];

const emCentavos = (valor) => Math.round(valor * 100);
const emReais = (centavos) => centavos / 100;
const somar = (itens) => itens.reduce((total, item) => total + item.centavos, 0);
const umaCasa = (numero) => Math.round(numero * 10) / 10;

const moeda = (centavos) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(emReais(centavos)).replace(/\u00A0/g, ' ');
const percentual = (numero) => numero.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function mesDeCaixa(lancamento) {
    if (lancamento.tipo === 'saida' && lancamento.fonteTipo === 'cartao_credito') {
        const cartao = { diaFechamento: lancamento.diaFechamento, diaVencimento: lancamento.diaVencimento };
        return calcularFatura(lancamento.data, cartao, lancamento.parcelaAtual).referencia;
    }
    return lancamento.data.slice(0, 7);
}

function faixaDaPoupanca(taxa) {
    if (taxa < 0) return 'critico';
    if (taxa < LIMITES.poupancaMinima) return 'atencao';
    return 'saudavel';
}

function faixaDoCartao(percentualDaRenda) {
    if (percentualDaRenda > LIMITES.cartaoCritico) return 'critico';
    if (percentualDaRenda > LIMITES.cartaoSaudavel) return 'atencao';
    return 'saudavel';
}

export function analisarSaudeFinanceira(lancamentos, mesAtual) {
    const mesesAnalisados = [-3, -2, -1].map((deslocamento) => deslocarMes(mesAtual, deslocamento));
    const proximosMeses = (quantidade) => Array.from({ length: quantidade }, (_, i) => deslocarMes(mesAtual, i + 1));
    const referencia = { mesesAnalisados, mesAtual };

    const itens = lancamentos.map((lancamento) => ({
        tipo: lancamento.tipo,
        centavos: emCentavos(lancamento.valor),
        mes: mesDeCaixa(lancamento),
        ehCartao: lancamento.tipo === 'saida' && lancamento.fonteTipo === 'cartao_credito',
        parcelado: lancamento.totalParcelas > 1,
        categoriaId: lancamento.categoriaId,
        categoriaNome: lancamento.categoriaNome,
    }));

    const naJanela = itens.filter((item) => mesesAnalisados.includes(item.mes));
    const mesesComDados = new Set(naJanela.map((item) => item.mes)).size;
    if (mesesComDados === 0) {
        return { dadosSuficientes: false, motivo: 'sem-lancamentos', referencia };
    }

    const entradasDaJanela = somar(naJanela.filter((item) => item.tipo === 'entrada'));
    if (entradasDaJanela === 0) {
        return { dadosSuficientes: false, motivo: 'sem-entradas', referencia };
    }

    const saidasDaJanela = naJanela.filter((item) => item.tipo === 'saida');
    const rendaMedia = Math.round(entradasDaJanela / mesesComDados);
    if (rendaMedia === 0) {
        return { dadosSuficientes: false, motivo: 'sem-entradas', referencia };
    }
    const saidasAVistaMedia = Math.round(somar(saidasDaJanela.filter((item) => !item.ehCartao)) / mesesComDados);
    const faturaDoMes = (mes) => somar(itens.filter((item) => item.ehCartao && item.mes === mes));

    const taxaPoupanca = umaCasa(((entradasDaJanela - somar(saidasDaJanela)) / entradasDaJanela) * 100);

    const faturaMedia = Math.round(proximosMeses(3).reduce((total, mes) => total + faturaDoMes(mes), 0) / 3);
    const comprometimento = umaCasa((faturaMedia / rendaMedia) * 100);

    const parcelasPorMes = proximosMeses(6)
        .map((mes) => ({
            mes,
            centavos: somar(itens.filter((item) => item.ehCartao && item.parcelado && item.mes === mes)),
        }))
        .filter((parcela) => parcela.centavos > 0);
    const totalDeParcelas = parcelasPorMes.reduce((total, parcela) => total + parcela.centavos, 0);
    const maisPesado = parcelasPorMes.reduce((maior, parcela) => (!maior || parcela.centavos > maior.centavos ? parcela : maior), null);
    const pesoDoMaisPesado = maisPesado ? (maisPesado.centavos / rendaMedia) * 100 : 0;
    const faixaDasParcelas = !maisPesado ? 'saudavel' : pesoDoMaisPesado > LIMITES.parcelaPesada ? 'atencao' : 'informativo';

    const categorias = new Map();
    for (const item of itens.filter((i) => i.tipo === 'saida')) {
        const atual = categorias.get(item.categoriaId) ?? { nome: item.categoriaNome, janela: 0, mesAtual: 0 };
        if (mesesAnalisados.includes(item.mes)) atual.janela += item.centavos;
        if (item.mes === mesAtual) atual.mesAtual += item.centavos;
        categorias.set(item.categoriaId, atual);
    }
    const foraDaCurva = [...categorias.entries()]
        .map(([categoriaId, dados]) => {
            const media = Math.round(dados.janela / mesesComDados);
            const variacao = media > 0 ? ((dados.mesAtual - media) / media) * 100 : 0;
            return { categoriaId, nome: dados.nome, mesAtual: dados.mesAtual, media, variacao };
        })
        .filter((categoria) => categoria.media >= emCentavos(LIMITES.mediaMinimaCategoria) && categoria.variacao > LIMITES.foraDaCurva)
        .sort((a, b) => b.variacao - a.variacao)
        .slice(0, 3);

    let acumulado = 0;
    const projecao = proximosMeses(6).map((mes) => {
        const saidas = saidasAVistaMedia + faturaDoMes(mes);
        const resultado = rendaMedia - saidas;
        acumulado += resultado;
        return { mes, entradas: rendaMedia, saidas, resultado, acumulado };
    });

    const dicas = [];
    const dica = (faixa, indicador, texto) => dicas.push({ faixa, indicador, texto });

    const faixaPoupanca = faixaDaPoupanca(taxaPoupanca);
    if (faixaPoupanca === 'critico') {
        dica('critico', 'taxaPoupanca', 'No período analisado você gastou mais do que recebeu. Revise as categorias de maior peso.');
    } else if (faixaPoupanca === 'atencao') {
        dica('atencao', 'taxaPoupanca', `Você guardou ${percentual(taxaPoupanca)}% da sua renda. Uma meta comum é guardar pelo menos ${LIMITES.poupancaMinima}%.`);
    } else {
        dica('saudavel', 'taxaPoupanca', `Você guardou ${percentual(taxaPoupanca)}% da sua renda, acima da meta de ${LIMITES.poupancaMinima}%.`);
    }

    const faixaCartoes = faixaDoCartao(comprometimento);
    if (faturaMedia > 0) {
        if (faixaCartoes === 'critico') {
            dica('critico', 'comprometimentoCartoes', `Suas faturas comprometem ${percentual(comprometimento)}% da sua renda, mais da metade do que você recebe.`);
        } else if (faixaCartoes === 'atencao') {
            dica('atencao', 'comprometimentoCartoes', `Suas faturas dos próximos 3 meses comprometem ${percentual(comprometimento)}% da sua renda. Evite novas compras parceladas.`);
        } else {
            dica('saudavel', 'comprometimentoCartoes', `Suas faturas comprometem ${percentual(comprometimento)}% da sua renda mensal.`);
        }
    }

    if (maisPesado) {
        if (faixaDasParcelas === 'atencao') {
            dica('atencao', 'parcelasFuturas', `Em ${nomeDoMes(maisPesado.mes)}, as parcelas somam ${moeda(maisPesado.centavos)}, ${percentual(pesoDoMaisPesado)}% da sua renda.`);
        } else {
            const ultimo = parcelasPorMes[parcelasPorMes.length - 1].mes;
            dica('informativo', 'parcelasFuturas', `Você tem ${moeda(totalDeParcelas)} em parcelas até ${nomeDoMes(ultimo)}.`);
        }
    }

    for (const categoria of foraDaCurva) {
        dica('atencao', 'categoriasForaDaCurva', `Seus gastos com ${categoria.nome} estão ${percentual(categoria.variacao)}% acima da sua média dos meses anteriores.`);
    }

    const primeiroNegativo = projecao.find((mes) => mes.resultado < 0);
    if (primeiroNegativo) {
        dica('critico', 'projecao', `Pelas suas médias, em ${nomeDoMes(primeiroNegativo.mes)} as saídas conhecidas superam sua renda em ${moeda(-primeiroNegativo.resultado)}.`);
    }

    const dicasOrdenadas = dicas
        .map((item, ordem) => ({ item, ordem }))
        .sort((a, b) => ORDEM_DAS_FAIXAS.indexOf(a.item.faixa) - ORDEM_DAS_FAIXAS.indexOf(b.item.faixa) || a.ordem - b.ordem)
        .map(({ item }) => item)
        .slice(0, MAXIMO_DE_DICAS);

    return {
        dadosSuficientes: true,
        referencia,
        rendaMediaMensal: emReais(rendaMedia),
        indicadores: {
            taxaPoupanca: { valor: taxaPoupanca, faixa: faixaPoupanca },
            comprometimentoCartoes: { valor: comprometimento, faixa: faixaCartoes, faturaMedia: emReais(faturaMedia) },
            parcelasFuturas: {
                total: emReais(totalDeParcelas),
                ate: parcelasPorMes.length > 0 ? parcelasPorMes[parcelasPorMes.length - 1].mes : null,
                mesMaisPesado: maisPesado ? { mes: maisPesado.mes, valor: emReais(maisPesado.centavos) } : null,
                porMes: parcelasPorMes.map((parcela) => ({ mes: parcela.mes, valor: emReais(parcela.centavos) })),
                faixa: faixaDasParcelas,
            },
            categoriasForaDaCurva: foraDaCurva.map((categoria) => ({
                categoriaId: categoria.categoriaId,
                nome: categoria.nome,
                mesAtual: emReais(categoria.mesAtual),
                media: emReais(categoria.media),
                variacaoPercentual: umaCasa(categoria.variacao),
            })),
        },
        projecao: projecao.map((mes) => ({
            mes: mes.mes,
            entradas: emReais(mes.entradas),
            saidas: emReais(mes.saidas),
            resultado: emReais(mes.resultado),
            acumulado: emReais(mes.acumulado),
        })),
        dicas: dicasOrdenadas,
    };
}