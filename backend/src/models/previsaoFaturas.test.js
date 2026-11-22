import assert from 'node:assert/strict';
import test from 'node:test';
import { faturasDoCartao, montarPrevisaoDeFaturas } from './previsaoFaturas.js';

const nubank = { id: 3, nome: 'Nubank', limite: 5000, diaFechamento: 3, diaVencimento: 10 };
const visa = { id: 4, nome: 'Visa', limite: 8000, diaFechamento: 25, diaVencimento: 5 };

const parcelas = (lancamentoId, descricao, data, valor, total) =>
    Array.from({ length: total }, (_, indice) => ({
        lancamentoId: lancamentoId + indice,
        cartaoId: nubank.id,
        descricao,
        data,
        parcelaAtual: indice + 1,
        totalParcelas: total,
        valor,
    }));

test('a lista começa na primeira fatura que ainda não venceu', () => {
    const depoisDoVencimento = faturasDoCartao(nubank, '2026-11-22', 4);
    assert.deepEqual(depoisDoVencimento.map((fatura) => fatura.referencia), ['2026-12', '2027-01', '2027-02', '2027-03']);
    assert.equal(depoisDoVencimento[0].situacao, 'aberta');

    const entreFechamentoEVencimento = faturasDoCartao(nubank, '2026-11-05', 4);
    assert.deepEqual(entreFechamentoEVencimento.map((fatura) => fatura.referencia), ['2026-11', '2026-12', '2027-01', '2027-02']);
    assert.deepEqual(entreFechamentoEVencimento[0], {
        referencia: '2026-11',
        fechamento: '2026-11-03',
        vencimento: '2026-11-10',
        situacao: 'fechada',
    });
    assert.equal(entreFechamentoEVencimento[1].situacao, 'aberta');
});

test('cartão com vencimento no mês seguinte ao fechamento', () => {
    const faturas = faturasDoCartao(visa, '2026-11-28', 2);
    assert.deepEqual(faturas, [
        { referencia: '2026-12', fechamento: '2026-11-25', vencimento: '2026-12-05', situacao: 'fechada' },
        { referencia: '2027-01', fechamento: '2026-12-25', vencimento: '2027-01-05', situacao: 'aberta' },
    ]);
});

test('cada parcela entra na sua fatura e o total soma em centavos', () => {
    const compras = [
        ...parcelas(100, 'Notebook', '2026-09-12', 450, 10),
        { lancamentoId: 200, cartaoId: nubank.id, descricao: 'Livro', data: '2026-11-20', parcelaAtual: 1, totalParcelas: 1, valor: 89.9 },
        { lancamentoId: 201, cartaoId: nubank.id, descricao: 'Café', data: '2026-11-21', parcelaAtual: 1, totalParcelas: 1, valor: 0.1 },
        { lancamentoId: 300, cartaoId: visa.id, descricao: 'Outro cartão', data: '2026-11-20', parcelaAtual: 1, totalParcelas: 1, valor: 999 },
    ];

    const previsao = montarPrevisaoDeFaturas({ cartoes: [nubank], compras, hoje: '2026-11-22', quantidade: 4 });
    const [cartao] = previsao.cartoes;
    const [dezembro, janeiro] = cartao.faturas;

    assert.equal(previsao.hoje, '2026-11-22');
    assert.equal(cartao.limite, 5000);
    assert.equal(cartao.faturas.length, 4);
    assert.equal(dezembro.referencia, '2026-12');
    assert.deepEqual(dezembro.compras.map((compra) => `${compra.descricao} ${compra.parcelaAtual}/${compra.totalParcelas}`), [
        'Notebook 3/10',
        'Livro 1/1',
        'Café 1/1',
    ]);
    assert.equal(dezembro.total, 540);
    assert.equal(janeiro.total, 450);
    assert.equal(janeiro.compras[0].parcelaAtual, 4);
});

test('cartão sem compras tem faturas zeradas', () => {
    const previsao = montarPrevisaoDeFaturas({ cartoes: [visa], compras: [], hoje: '2026-11-22', quantidade: 1 });
    assert.deepEqual(previsao.cartoes[0].faturas, [
        { referencia: '2026-12', fechamento: '2026-11-25', vencimento: '2026-12-05', situacao: 'aberta', compras: [], total: 0 },
    ]);
});