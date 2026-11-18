import assert from 'node:assert/strict';
import test from 'node:test';
import { montarWhere } from './filtros.js';

const periodo = { inicio: '2026-11-01', fim: '2026-11-30' };

test('sem filtros opcionais, só usuário e período', () => {
    const { where, parametros } = montarWhere(7, periodo);
    assert.equal(where, 'l.usuario_id = $1 AND l.data BETWEEN $2 AND $3');
    assert.deepEqual(parametros, [7, '2026-11-01', '2026-11-30']);
});

test('filtros opcionais entram em ordem, sempre como parâmetros', () => {
    const { where, parametros } = montarWhere(7, { ...periodo, tipo: 'saida', categoriaId: 3, fonteDestinoId: 5 });
    assert.equal(
        where,
        'l.usuario_id = $1 AND l.data BETWEEN $2 AND $3 AND l.tipo = $4 AND l.categoria_id = $5 AND l.fonte_destino_id = $6',
    );
    assert.deepEqual(parametros, [7, '2026-11-01', '2026-11-30', 'saida', 3, 5]);
});

test('o valor do usuário nunca aparece no texto do SQL', () => {
    const { where } = montarWhere(7, { ...periodo, tipo: "saida'; DROP TABLE lancamentos; --" });
    assert.equal(where.includes('DROP'), false);
});