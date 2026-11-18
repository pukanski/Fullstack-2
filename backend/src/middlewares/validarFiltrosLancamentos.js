import { z } from 'zod';
import { mesCorrente } from '../models/periodo.js';
import { ErroHttp } from './erros.js';

// Parâmetros de URL chegam sempre como texto. Texto vazio ("?tipo=") é tratado como "não informado".
const vazioViraNada = (valor) => (typeof valor === 'string' && valor.trim() === '' ? undefined : valor);

// "3" vira 3; qualquer outra coisa que não seja só dígitos continua como está (e reprova)
const inteiroDeTexto = (valor) => (typeof valor === 'string' && /^\d+$/.test(valor.trim()) ? Number(valor) : valor);

const entradaOpcional = (esquema) => z.preprocess((valor) => inteiroDeTexto(vazioViraNada(valor)), esquema.optional());

const id = z
    .number({ error: 'Informe um número inteiro.' })
    .int('Informe um número inteiro.')
    .min(1, 'Informe um valor válido.')
    .max(2147483647, 'Informe um valor válido.');

export const esquemaFiltros = z
    .object({
        inicio: z.preprocess(vazioViraNada, z.iso.date({ error: 'Informe uma data válida no formato AAAA-MM-DD.' }).optional()),
        fim: z.preprocess(vazioViraNada, z.iso.date({ error: 'Informe uma data válida no formato AAAA-MM-DD.' }).optional()),
        tipo: z.preprocess(vazioViraNada, z.enum(['entrada', 'saida'], { error: "O tipo deve ser 'entrada' ou 'saida'." }).optional()),
        categoriaId: entradaOpcional(id),
        fonteDestinoId: entradaOpcional(id),
        pagina: entradaOpcional(
            z
                .number({ error: 'Informe um número de página válido.' })
                .int('Informe um número de página válido.')
                .min(1, 'Informe um número de página válido.')
                .max(1000000, 'Informe um número de página válido.'),
        ),
    })
    // O período vai por inteiro ou não vai: nada de meio período
    .refine((dados) => !dados.inicio || dados.fim, { error: 'Informe também a data final.', path: ['fim'] })
    .refine((dados) => !dados.fim || dados.inicio, { error: 'Informe também a data inicial.', path: ['inicio'] })
    .refine((dados) => !dados.inicio || !dados.fim || dados.inicio <= dados.fim, {
        error: 'A data inicial não pode ser depois da data final.',
        path: ['inicio'],
    })

    .transform((dados) => ({
        ...dados,
        ...(dados.inicio ? {} : mesCorrente()),
        pagina: dados.pagina ?? 1,
    }));

export function validarFiltrosLancamentos(req, res, next) {
    const resultado = esquemaFiltros.safeParse(req.query);

    if (!resultado.success) {
        const campos = {};
        for (const problema of resultado.error.issues) {
            const campo = problema.path[0];
            if (campo !== undefined && !(campo in campos)) {
                campos[campo] = problema.message;
            }
        }
        throw new ErroHttp(400, 'Filtros inválidos.', campos);
    }

    req.filtros = resultado.data;
    next();
}