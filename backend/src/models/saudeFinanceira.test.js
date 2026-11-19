import assert from 'node:assert/strict';
import test from 'node:test';
import { analisarSaudeFinanceira } from './saudeFinanceira.js';

const MES_ATUAL = '2026-11';

const lanc = (tipo, valor, data, extra = {}) => ({
    tipo, valor, data,
    categoriaId: 1, categoriaNome: 'Geral',
    fonteTipo: 'conta', diaFechamento: null, diaVencimento: null,
    parcelaAtual: 1, totalParcelas: 1,
    ...extra,
});

const noCartao = { fonteTipo: 'cartao_credito', diaFechamento: 3, diaVencimento: 10 };

const parcelado = (valorDaParcela, parcelas, data, extra = {}) =>
    Array.from({ length: parcelas }, (_, i) =>
        lanc('saida', valorDaParcela, data, { ...noCartao, parcelaAtual: i + 1, totalParcelas: parcelas, ...extra }),
    );

function cenarioSaudavel() {
    const dados = [];
    for (const mes of ['08', '09', '10']) {
        dados.push(lanc('entrada', 4000, `2026-${mes}-05`, { categoriaId: 10, categoriaNome: 'Salário' }));
        dados.push(lanc('saida', 1500, `2026-${mes}-10`, { categoriaId: 2, categoriaNome: 'Moradia' }));
        dados.push(lanc('saida', 500, `2026-${mes}-15`, { categoriaId: 3, categoriaNome: 'Alimentação' }));
    }
    dados.push(lanc('saida', 800, '2026-11-08', { categoriaId: 3, categoriaNome: 'Alimentação' }));
    dados.push(lanc('saida', 1500, '2026-11-10', { categoriaId: 2, categoriaNome: 'Moradia' }));
    dados.push(...parcelado(100, 12, '2026-09-20', { categoriaId: 4, categoriaNome: 'Educação' }));
    dados.push(lanc('saida', 300, '2026-10-20', { ...noCartao, categoriaId: 5, categoriaNome: 'Lazer' }));
    return dados;
}

test('cenário saudável: indicadores, projeção e dicas', () => {
    const r = analisarSaudeFinanceira(cenarioSaudavel(), MES_ATUAL);

    assert.equal(r.dadosSuficientes, true);
    assert.deepEqual(r.referencia, { mesesAnalisados: ['2026-08', '2026-09', '2026-10'], mesAtual: '2026-11' });
    assert.equal(r.rendaMediaMensal, 4000);

    assert.deepEqual(r.indicadores.taxaPoupanca, { valor: 49.2, faixa: 'saudavel' });

    assert.deepEqual(r.indicadores.comprometimentoCartoes, { valor: 2.5, faixa: 'saudavel', faturaMedia: 100 });

    assert.equal(r.indicadores.parcelasFuturas.total, 600);
    assert.equal(r.indicadores.parcelasFuturas.ate, '2027-05');
    assert.deepEqual(r.indicadores.parcelasFuturas.mesMaisPesado, { mes: '2026-12', valor: 100 });
    assert.equal(r.indicadores.parcelasFuturas.porMes.length, 6);
    assert.equal(r.indicadores.parcelasFuturas.faixa, 'informativo');

    assert.deepEqual(r.indicadores.categoriasForaDaCurva, [
        { categoriaId: 3, nome: 'Alimentação', mesAtual: 800, media: 500, variacaoPercentual: 60 },
    ]);

    assert.equal(r.projecao.length, 6);
    assert.deepEqual(r.projecao[0], { mes: '2026-12', entradas: 4000, saidas: 2100, resultado: 1900, acumulado: 1900 });
    assert.equal(r.projecao[5].acumulado, 11400);

    assert.deepEqual(r.dicas.map((d) => [d.faixa, d.indicador]), [
        ['atencao', 'categoriasForaDaCurva'],
        ['informativo', 'parcelasFuturas'],
        ['saudavel', 'taxaPoupanca'],
        ['saudavel', 'comprometimentoCartoes'],
    ]);
    assert.equal(r.dicas[0].texto, 'Seus gastos com Alimentação estão 60,0% acima da sua média dos meses anteriores.');
    assert.equal(r.dicas[1].texto, 'Você tem R$ 600,00 em parcelas até maio de 2027.');
    assert.equal(r.dicas[2].texto, 'Você guardou 49,2% da sua renda, acima da meta de 10%.');
});

test('sem lançamentos nos meses analisados: dados insuficientes', () => {
    assert.deepEqual(analisarSaudeFinanceira([], MES_ATUAL), {
        dadosSuficientes: false,
        motivo: 'sem-lancamentos',
        referencia: { mesesAnalisados: ['2026-08', '2026-09', '2026-10'], mesAtual: '2026-11' },
    });
    const soMesAtual = [lanc('entrada', 3000, '2026-11-05'), lanc('saida', 500, '2026-11-06')];
    assert.equal(analisarSaudeFinanceira(soMesAtual, MES_ATUAL).motivo, 'sem-lancamentos');
});

test('só saídas, sem nenhuma entrada: dados insuficientes (sem divisão por zero)', () => {
    const r = analisarSaudeFinanceira([lanc('saida', 500, '2026-10-06')], MES_ATUAL);
    assert.equal(r.dadosSuficientes, false);
    assert.equal(r.motivo, 'sem-entradas');
});

test('usuário com apenas 1 mês de dados usa a média desse mês, e não dividida por 3', () => {
    const dados = [lanc('entrada', 3000, '2026-10-05'), lanc('saida', 1000, '2026-10-06')];
    const r = analisarSaudeFinanceira(dados, MES_ATUAL);
    assert.equal(r.dadosSuficientes, true);
    assert.equal(r.rendaMediaMensal, 3000);
    assert.equal(r.indicadores.taxaPoupanca.valor, 66.7);
});

test('gastar mais do que recebe: faixa crítica, dica crítica e projeção negativa', () => {
    const dados = [];
    for (const mes of ['08', '09', '10']) {
        dados.push(lanc('entrada', 1000, `2026-${mes}-05`));
        dados.push(lanc('saida', 1500, `2026-${mes}-10`));
    }
    const r = analisarSaudeFinanceira(dados, MES_ATUAL);
    assert.deepEqual(r.indicadores.taxaPoupanca, { valor: -50, faixa: 'critico' });
    assert.equal(r.projecao[0].resultado, -500);
    assert.equal(r.dicas[0].faixa, 'critico');
    assert.ok(r.dicas.some((d) => d.indicador === 'projecao' && d.texto.includes('dezembro de 2026') && d.texto.includes('R$ 500,00')));
});

test('o limite de 10% de poupança: 9,9% é atenção e 10% é saudável', () => {
    const com = (saidas) => {
        const dados = [];
        for (const mes of ['08', '09', '10']) {
            dados.push(lanc('entrada', 1000, `2026-${mes}-05`));
            dados.push(lanc('saida', saidas, `2026-${mes}-10`));
        }
        return analisarSaudeFinanceira(dados, MES_ATUAL).indicadores.taxaPoupanca;
    };
    assert.deepEqual(com(901), { valor: 9.9, faixa: 'atencao' });
    assert.deepEqual(com(900), { valor: 10, faixa: 'saudavel' });
});

test('cartão pesado: comprometimento crítico, parcela pesada e no máximo 5 dicas, as mais graves primeiro', () => {
    const dados = [];
    const categorias = [['A', 700], ['B', 700], ['C', 800]];
    categorias.forEach(([nome, valor], indice) => {
        for (const mes of ['08', '09', '10']) {
            dados.push(lanc('saida', valor, `2026-${mes}-10`, { categoriaId: 20 + indice, categoriaNome: nome }));
        }
        dados.push(lanc('saida', valor * 2, '2026-11-10', { categoriaId: 20 + indice, categoriaNome: nome }));
    });
    for (const mes of ['08', '09', '10']) dados.push(lanc('entrada', 2000, `2026-${mes}-05`));
    dados.push(...parcelado(1500, 6, '2026-10-20'));

    const r = analisarSaudeFinanceira(dados, MES_ATUAL);

    assert.equal(r.indicadores.comprometimentoCartoes.faixa, 'critico');
    assert.equal(r.indicadores.comprometimentoCartoes.valor, 75);
    assert.equal(r.indicadores.parcelasFuturas.faixa, 'atencao');
    assert.equal(r.indicadores.categoriasForaDaCurva.length, 3);
    assert.equal(r.dicas.length, 5);
    assert.deepEqual(r.dicas.slice(0, 3).map((d) => d.faixa), ['critico', 'critico', 'critico']);
});

test('categorias com média abaixo de R$ 50 são ignoradas', () => {
    const dados = [lanc('entrada', 3000, '2026-10-05')];
    for (const mes of ['08', '09', '10']) dados.push(lanc('saida', 30, `2026-${mes}-10`, { categoriaId: 7, categoriaNome: 'Café' }));
    dados.push(lanc('saida', 300, '2026-11-10', { categoriaId: 7, categoriaNome: 'Café' }));
    assert.deepEqual(analisarSaudeFinanceira(dados, MES_ATUAL).indicadores.categoriasForaDaCurva, []);
});