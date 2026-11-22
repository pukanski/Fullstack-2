import { fimDoMes, inicioDoMes } from './datas.js';

const CAMPOS_DA_BUSCA = ['inicio', 'fim', 'tipo', 'categoriaId', 'fonteDestinoId', 'pagina'];

export function filtrosDoMes(referencia = new Date()) {
    return {
        inicio: inicioDoMes(referencia),
        fim: fimDoMes(referencia),
        tipo: '',
        categoriaId: '',
        fonteDestinoId: '',
    };
}

export function errosDoPeriodo({ inicio, fim }) {
    if (inicio && !fim) {
        return { fim: 'Informe também a data final.' };
    }
    if (fim && !inicio) {
        return { inicio: 'Informe também a data inicial.' };
    }
    if (inicio && fim && inicio > fim) {
        return { inicio: 'A data inicial não pode ser depois da data final.' };
    }
    return {};
}

export function parametrosDaBusca(filtros = {}) {
    const parametros = {};
    for (const campo of CAMPOS_DA_BUSCA) {
        const valor = filtros[campo];
        if (valor !== '' && valor !== null && valor !== undefined) {
            parametros[campo] = valor;
        }
    }
    return parametros;
}

export function categoriasDoTipo(categorias, tipo) {
    return tipo ? categorias.filter((categoria) => categoria.tipo === tipo) : categorias;
}

export function nomeDaCategoria(categoria, mostrarTipo) {
    if (!mostrarTipo) {
        return categoria.nome;
    }
    return `${categoria.nome} (${categoria.tipo === 'entrada' ? 'entrada' : 'saída'})`;
}

export function rotuloDaParcela({ parcelaAtual, totalParcelas }) {
    return totalParcelas > 1 ? `${parcelaAtual}/${totalParcelas}` : '';
}