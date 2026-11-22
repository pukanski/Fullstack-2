import assert from 'node:assert/strict';
import test from 'node:test';
import {
    formatarPercentual,
    infoDaFaixa,
    maiorValorDaProjecao,
    mensagemSemDados,
    mesAbreviado,
    nomeDoMes,
    periodoAnalisado,
} from './saudeFinanceira.js';

const referencia = { mesesAnalisados: ['2026-08', '2026-09', '2026-10'], mesAtual: '2026-11' };

test('rótulo e cor de cada faixa', () => {
    assert.deepEqual(infoDaFaixa('critico'), { rotulo: 'Crítico', cor: 'error' });
    assert.deepEqual(infoDaFaixa('atencao'), { rotulo: 'Atenção', cor: 'warning' });
    assert.deepEqual(infoDaFaixa('informativo'), { rotulo: 'Informativo', cor: 'info' });
    assert.deepEqual(infoDaFaixa('saudavel'), { rotulo: 'Saudável', cor: 'success' });
    assert.deepEqual(infoDaFaixa('outra'), { rotulo: '—', cor: 'info' });
});

test('nomes dos meses', () => {
    assert.equal(mesAbreviado('2026-11'), 'nov/26');
    assert.equal(mesAbreviado('2027-01'), 'jan/27');
    assert.equal(nomeDoMes('2026-03'), 'março de 2026');
    assert.equal(nomeDoMes('2026-13'), '');
    assert.equal(mesAbreviado(null), '');
});

test('período analisado e mensagens sem dados', () => {
    assert.equal(periodoAnalisado(referencia), 'agosto de 2026 a outubro de 2026');
    assert.equal(periodoAnalisado({}), '');
    assert.match(mensagemSemDados('sem-lancamentos', referencia), /Ainda não há lançamentos .*agosto de 2026/);
    assert.match(mensagemSemDados('sem-entradas', referencia), /Não há entradas registradas/);
});

test('percentual e escala do gráfico', () => {
    assert.equal(formatarPercentual(12.5), '12,5%');
    assert.equal(formatarPercentual(-3), '-3,0%');
    assert.equal(formatarPercentual(null), '—');
    assert.equal(
        maiorValorDaProjecao([
            { entradas: 4200, saidas: 3100 },
            { entradas: 4200, saidas: 5100 },
        ]),
        5100,
    );
    assert.equal(maiorValorDaProjecao([]), 0);
});