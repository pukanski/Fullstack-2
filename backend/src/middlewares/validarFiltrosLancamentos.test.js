import assert from 'node:assert/strict';
import test from 'node:test';
import { esquemaFiltros } from './validarFiltrosLancamentos.js';

const formatoData = /^\d{4}-\d{2}-\d{2}$/;

// Devolve os campos que falharam, em ordem alfabética
function camposComErro(consulta) {
    const resultado = esquemaFiltros.safeParse(consulta);
    assert.equal(resultado.success, false);
    return [...new Set(resultado.error.issues.map((problema) => problema.path[0]))].sort();
}

test('sem nenhum filtro: mês corrente e página 1', () => {
    const resultado = esquemaFiltros.safeParse({});
    assert.equal(resultado.success, true);
    assert.match(resultado.data.inicio, formatoData);
    assert.match(resultado.data.fim, formatoData);
    assert.equal(resultado.data.inicio.slice(0, 7), resultado.data.fim.slice(0, 7)); // mesmo mês
    assert.equal(resultado.data.inicio.slice(8), '01');
    assert.equal(resultado.data.pagina, 1);
});

test('filtros completos chegam convertidos (texto vira número)', () => {
    const resultado = esquemaFiltros.safeParse({
        inicio: '2026-10-01', fim: '2026-10-31', tipo: 'saida', categoriaId: '3', fonteDestinoId: '5', pagina: '2',
    });
    assert.equal(resultado.success, true);
    assert.deepEqual(resultado.data, {
        inicio: '2026-10-01', fim: '2026-10-31', tipo: 'saida', categoriaId: 3, fonteDestinoId: 5, pagina: 2,
    });
});

test('texto vazio vale como "não informado"', () => {
    const resultado = esquemaFiltros.safeParse({ tipo: '', categoriaId: '', fonteDestinoId: ' ', pagina: '', inicio: '', fim: '' });
    assert.equal(resultado.success, true);
    assert.equal(resultado.data.tipo, undefined);
    assert.equal(resultado.data.categoriaId, undefined);
    assert.equal(resultado.data.pagina, 1);
});

test('período pela metade é reprovado', () => {
    assert.deepEqual(camposComErro({ inicio: '2026-10-01' }), ['fim']);
    assert.deepEqual(camposComErro({ fim: '2026-10-31' }), ['inicio']);
});

test('data inicial depois da final é reprovada', () => {
    assert.deepEqual(camposComErro({ inicio: '2026-11-10', fim: '2026-11-01' }), ['inicio']);
});

test('datas inexistentes ou em outro formato são reprovadas', () => {
    assert.deepEqual(camposComErro({ inicio: '2026-02-30', fim: '2026-03-01' }), ['inicio']);
    assert.deepEqual(camposComErro({ inicio: '01/11/2026', fim: '30/11/2026' }), ['fim', 'inicio']);
});

test('tipo, ids e página inválidos são reprovados', () => {
    assert.deepEqual(camposComErro({ tipo: 'despesa' }), ['tipo']);
    assert.deepEqual(camposComErro({ categoriaId: 'abc', fonteDestinoId: '0' }), ['categoriaId', 'fonteDestinoId']);
    assert.deepEqual(camposComErro({ pagina: '0' }), ['pagina']);
    assert.deepEqual(camposComErro({ pagina: '-1' }), ['pagina']);
    assert.deepEqual(camposComErro({ pagina: '1.5' }), ['pagina']);
});

test('parâmetro repetido na URL (vira lista) é reprovado', () => {
    assert.deepEqual(camposComErro({ tipo: ['entrada', 'saida'] }), ['tipo']);
});

test('parâmetros desconhecidos são ignorados', () => {
    const resultado = esquemaFiltros.safeParse({ usuarioId: '2', ordem: 'asc' });
    assert.equal(resultado.success, true);
    assert.equal('usuarioId' in resultado.data, false);
});