import assert from 'node:assert/strict';
import test from 'node:test';
import { esquemaMesesFaturas } from './validarMesesFaturas.js';

const meses = (consulta) => esquemaMesesFaturas.safeParse(consulta);

test('sem o parâmetro: fatura atual e as 3 próximas', () => {
    assert.deepEqual(meses({}).data, { meses: 4 });
    assert.deepEqual(meses({ meses: '' }).data, { meses: 4 });
});

test('quantidade informada chega como número', () => {
    assert.deepEqual(meses({ meses: '1' }).data, { meses: 1 });
    assert.deepEqual(meses({ meses: '12' }).data, { meses: 12 });
});

test('valores fora de 1 a 12 ou que não são inteiros são reprovados', () => {
    for (const valor of ['0', '13', '-1', '2.5', 'abc', ['1', '2']]) {
        assert.equal(meses({ meses: valor }).success, false, `deveria reprovar ${valor}`);
    }
});