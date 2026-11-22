const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const DECIMAL = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MAXIMO_DE_DIGITOS = 12;

export function formatarMoeda(valor) {
    const numero = Number(valor);
    if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) {
        return '';
    }
    return MOEDA.format(numero);
}

export function formatarData(data) {
    const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(data ?? ''));
    if (!partes) {
        return '';
    }
    const [, ano, mes, dia] = partes;
    return `${dia}/${mes}/${ano}`;
}

export function mascararValor(texto) {
    const digitos = String(texto ?? '')
        .replace(/\D/g, '')
        .replace(/^0+/, '')
        .slice(0, MAXIMO_DE_DIGITOS);
    if (!digitos) {
        return '';
    }
    return DECIMAL.format(Number(digitos) / 100);
}

export function valorParaNumero(texto) {
    const digitos = String(texto ?? '').replace(/\D/g, '');
    if (!digitos || Number(digitos) === 0) {
        return null;
    }
    return Number(digitos) / 100;
}

export function numeroParaValor(numero) {
    const valor = Number(numero);
    if (numero === null || numero === undefined || numero === '' || !Number.isFinite(valor) || valor <= 0) {
        return '';
    }
    return DECIMAL.format(valor);
}

export function formatarPercentual(valor) {
    const numero = Number(valor);
    if (valor === null || valor === undefined || valor === '' || !Number.isFinite(numero)) {
        return '';
    }
    return `${numero.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}