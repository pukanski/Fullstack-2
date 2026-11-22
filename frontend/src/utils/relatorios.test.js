import assert from 'node:assert/strict';
import test from 'node:test';
import {
    comPercentual,
    formatarPercentual,
    lerRelatorioFontes,
    maiorValor,
    nomeDoTipoDeFonte,
    periodoDoMes,
    somaDosTotais,
} from './relatorios.js';

test('período começa no mês atual', () => {
    assert.deepEqual(periodoDoMes(new Date(2026, 10, 22)), { inicio: '2026-11-01', fim: '2026-11-30' });
});

test('nome do tipo de fonte/destino', () => {
    assert.equal(nomeDoTipoDeFonte('renda'), 'Renda');
    assert.equal(nomeDoTipoDeFonte('conta'), 'Conta');
    assert.equal(nomeDoTipoDeFonte('cartao_credito'), 'Cartão de crédito');
    assert.equal(nomeDoTipoDeFonte('outro'), 'outro');
});

test('percentual de cada linha sobre o total', () => {
    const linhas = comPercentual([
        { nome: 'Conta corrente', total: 750 },
        { nome: 'Nubank', total: 250 },
    ]);
    assert.deepEqual(linhas.map((linha) => linha.percentual), [75, 25]);
    assert.deepEqual(comPercentual([{ nome: 'Vazio', total: 0 }])[0].percentual, 0);
    assert.equal(comPercentual([{ total: 1 }, { total: 2 }])[0].percentual, 33.3);
});

test('soma, maior valor e percentual formatado', () => {
    assert.equal(somaDosTotais([{ total: 10.5 }, { total: 4.5 }]), 15);
    assert.equal(maiorValor([3, 9, 2]), 9);
    assert.equal(maiorValor([]), 0);
    assert.equal(formatarPercentual(33.3), '33,3%');
    assert.equal(formatarPercentual(100), '100,0%');
});

test('lê a resposta do relatório no formato da API', () => {
    const lido = lerRelatorioFontes({
        periodo: { inicio: '2026-11-01', fim: '2026-11-30' },
        entradasPorFonte: [{ fonteDestinoId: 2, nome: 'Salário', tipo: 'renda', total: 4200 }],
        saidasPorDestino: [
            { fonteDestinoId: 1, nome: 'Conta corrente', tipo: 'conta', total: 2840 },
            { fonteDestinoId: 3, nome: 'Visa', tipo: 'cartao_credito', total: 120 },
        ],
        saldoPorConta: [{ fonteDestinoId: 1, nome: 'Conta corrente', entradas: 0, saidas: 2840, saldo: -2840 }],
    });
    assert.equal(lido.entradas[0].percentual, 100);
    assert.equal(lido.saidas.length, 2);
    assert.equal(lido.contas[0].saldo, -2840);
    assert.deepEqual(lerRelatorioFontes({}), {
        periodo: { inicio: '', fim: '' },
        entradas: [],
        saidas: [],
        contas: [],
    });
});