import bcrypt from 'bcrypt';
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { pool } from '../src/config/db.js';

const SENHA_DEMO = 'Demo1234';

const hoje = new Date();
const hojeISO = hoje.toISOString().slice(0, 10);

const CATEGORIAS_PADRAO = [
    { nome: 'Salário', tipo: 'entrada' },
    { nome: 'Outros', tipo: 'entrada' },
    { nome: 'Alimentação', tipo: 'saida' },
    { nome: 'Moradia', tipo: 'saida' },
    { nome: 'Saúde', tipo: 'saida' },
    { nome: 'Mobilidade', tipo: 'saida' },
    { nome: 'Lazer', tipo: 'saida' },
    { nome: 'Educação', tipo: 'saida' },
    { nome: 'Outros', tipo: 'saida' },
];

const CONTA_CORRENTE = { nome: 'Conta corrente', tipo: 'conta' };


const MESES = [-3, -2, -1, 0];

const entrada = (mes, dia, descricao, valor, categoria, fonte) => ({
    mes, dia, tipo: 'entrada', descricao, valor, categoria, fonte, parcelas: 1,
});

const saida = (mes, dia, descricao, valor, categoria, fonte, parcelas = 1) => ({
    mes, dia, tipo: 'saida', descricao, valor, categoria, fonte, parcelas,
});

const lancamentosAna = [
    ...MESES.flatMap((mes) => [
        entrada(mes, 5, 'Salário', 4200, 'Salário', 'Salário'),
        saida(mes, 10, 'Aluguel', 1500, 'Moradia', 'Conta corrente'),
        saida(mes, 12, 'Transporte', 220, 'Mobilidade', 'Conta corrente'),
        saida(mes, 8, 'Streaming', 55.9, 'Lazer', 'Nubank'),
        saida(mes, 14, 'Curso online', 120, 'Educação', 'Visa'),
    ]),

    ...[-3, -2, -1].flatMap((mes) => [
        saida(mes, 7, 'Mercado', 420, 'Alimentação', 'Conta corrente'),
        saida(mes, 21, 'Mercado', 380, 'Alimentação', 'Conta corrente'),
    ]),
    saida(0, 1, 'Mercado', 640, 'Alimentação', 'Conta corrente'),
    saida(0, 6, 'Mercado', 480, 'Alimentação', 'Conta corrente'),
    saida(-3, 18, 'Consulta médica', 250, 'Saúde', 'Conta corrente'),
    entrada(-1, 20, 'Rendimento da poupança', 35, 'Outros', 'Poupança'),

    saida(-1, 2, 'Livro técnico', 89.9, 'Educação', 'Nubank'),
    saida(-1, 3, 'Fones de ouvido', 199.9, 'Lazer', 'Nubank'),

    saida(-3, 28, 'Geladeira', 3600, 'Moradia', 'Visa', 12),
    saida(-2, 12, 'Notebook', 4500, 'Educação', 'Nubank', 10),
    saida(-1, 20, 'Celular', 1800, 'Outros', 'Visa', 6),
];

const lancamentosBruno = [
    ...MESES.flatMap((mes) => [
        entrada(mes, 5, 'Salário', 3200, 'Salário', 'Salário'),
        saida(mes, 8, 'Aluguel', 1400, 'Moradia', 'Conta corrente'),
        saida(mes, 11, 'Mercado', 650, 'Alimentação', 'Conta corrente'),
        saida(mes, 16, 'Transporte', 300, 'Mobilidade', 'Conta corrente'),
        saida(mes, 19, 'Delivery', 180, 'Alimentação', 'Inter'),
        saida(mes, 22, 'Academia', 99.9, 'Saúde', 'Inter'),
    ]),
    entrada(-2, 25, 'Projeto freelance', 900, 'Outros', 'Freelance'),
    saida(-3, 16, 'Sofá', 3000, 'Moradia', 'Inter', 12),
    saida(-2, 31, 'Smart TV', 2400, 'Lazer', 'Mastercard', 8),
    saida(-1, 10, 'Viagem', 1800, 'Lazer', 'Mastercard', 6),
];

const USUARIOS_DEMO = [
    {
        nome: 'Ana Demonstração',
        email: 'ana.demo@financas.com',
        cpf: '52998224725',
        fontes: [
            { nome: 'Salário', tipo: 'renda' },
            { nome: 'Poupança', tipo: 'conta' },
            { nome: 'Nubank', tipo: 'cartao_credito', dia_fechamento: 3, dia_vencimento: 10, limite: 6000 },
            { nome: 'Visa', tipo: 'cartao_credito', dia_fechamento: 25, dia_vencimento: 5, limite: 8000 },
        ],
        lancamentos: lancamentosAna,
    },
    {
        nome: 'Bruno Demonstração',
        email: 'bruno.demo@financas.com',
        cpf: '11144477735',
        fontes: [
            { nome: 'Salário', tipo: 'renda' },
            { nome: 'Freelance', tipo: 'renda' },
            { nome: 'Inter', tipo: 'cartao_credito', dia_fechamento: 15, dia_vencimento: 22, limite: 3500 },
            { nome: 'Mastercard', tipo: 'cartao_credito', dia_fechamento: 31, dia_vencimento: 10, limite: 5000 },
        ],
        lancamentos: lancamentosBruno,
    },
];


function dataISO(deslocamentoMes, dia) {
    const ano = hoje.getUTCFullYear();
    const mes = hoje.getUTCMonth() + deslocamentoMes;
    const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
    return new Date(Date.UTC(ano, mes, Math.min(dia, ultimoDia))).toISOString().slice(0, 10);
}

function dividirEmCentavos(valor, parcelas) {
    const total = Math.round(valor * 100);
    const base = Math.floor(total / parcelas);
    const resto = total - base * parcelas;
    return Array.from({ length: parcelas }, (_, i) => ((i === 0 ? base + resto : base) / 100).toFixed(2));
}

function obterId(mapa, chave, descricao) {
    const id = mapa.get(chave);
    if (!id) throw new Error(`${descricao} não encontrada(o): ${chave}`);
    return id;
}

async function semear() {
    const cliente = await pool.connect();
    try {
        await cliente.query('BEGIN');

        await cliente.query('DELETE FROM usuarios WHERE email = ANY($1)', [USUARIOS_DEMO.map((u) => u.email)]);

        const senhaHash = await bcrypt.hash(SENHA_DEMO, 10);

        for (const u of USUARIOS_DEMO) {
            const { rows: [usuario] } = await cliente.query(
                'INSERT INTO usuarios (nome, email, cpf, senha_hash) VALUES ($1, $2, $3, $4) RETURNING id',
                [u.nome, u.email, u.cpf, senhaHash],
            );

            const categorias = new Map();
            for (const c of CATEGORIAS_PADRAO) {
                const { rows: [linha] } = await cliente.query(
                    'INSERT INTO categorias (usuario_id, nome, tipo) VALUES ($1, $2, $3) RETURNING id',
                    [usuario.id, c.nome, c.tipo],
                );
                categorias.set(`${c.tipo}|${c.nome}`, linha.id);
            }

            const fontes = new Map();
            for (const f of [CONTA_CORRENTE, ...u.fontes]) {
                const { rows: [linha] } = await cliente.query(
                    `INSERT INTO fontes_destinos (usuario_id, nome, tipo, dia_fechamento, dia_vencimento, limite)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
                    [usuario.id, f.nome, f.tipo, f.dia_fechamento ?? null, f.dia_vencimento ?? null, f.limite ?? null],
                );
                fontes.set(f.nome, linha.id);
            }

            let total = 0;
            for (const l of u.lancamentos) {
                const data = dataISO(l.mes, l.dia);
                if (data > hojeISO) continue;

                const categoriaId = obterId(categorias, `${l.tipo}|${l.categoria}`, 'Categoria');
                const fonteId = obterId(fontes, l.fonte, 'Fonte/destino');
                const valores = dividirEmCentavos(l.valor, l.parcelas);
                const grupo = l.parcelas > 1 ? randomUUID() : null;

                for (let i = 0; i < l.parcelas; i++) {
                    await cliente.query(
                        `INSERT INTO lancamentos
               (usuario_id, tipo, descricao, valor, data, categoria_id, fonte_destino_id,
                parcela_atual, total_parcelas, grupo_parcelamento)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                        [usuario.id, l.tipo, l.descricao, valores[i], data, categoriaId, fonteId, i + 1, l.parcelas, grupo],
                    );
                    total += 1;
                }
            }

            console.log(`${u.nome}: ${total} lançamentos criados`);
        }

        await cliente.query('COMMIT');
        console.log(`Seed concluído. Senha dos usuários de demonstração: ${SENHA_DEMO}`);
    } catch (erro) {
        await cliente.query('ROLLBACK');
        throw erro;
    } finally {
        cliente.release();
    }
}

semear()
    .catch((erro) => {
        console.error('Erro ao executar o seed:', erro.message);
        process.exitCode = 1;
    })
    .finally(() => pool.end());