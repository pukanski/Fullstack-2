const MESES_ABREVIADOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const MESES = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const FAIXAS = {
    critico: { rotulo: 'Crítico', cor: 'error' },
    atencao: { rotulo: 'Atenção', cor: 'warning' },
    informativo: { rotulo: 'Informativo', cor: 'info' },
    saudavel: { rotulo: 'Saudável', cor: 'success' },
};

function partesDoMes(mes) {
    const [ano, numero] = String(mes ?? '').split('-').map(Number);
    return ano && numero >= 1 && numero <= 12 ? { ano, numero } : null;
}

export function infoDaFaixa(faixa) {
    return FAIXAS[faixa] ?? { rotulo: '—', cor: 'info' };
}

export function mesAbreviado(mes) {
    const partes = partesDoMes(mes);
    return partes ? `${MESES_ABREVIADOS[partes.numero - 1]}/${String(partes.ano).slice(2)}` : '';
}

export function nomeDoMes(mes) {
    const partes = partesDoMes(mes);
    return partes ? `${MESES[partes.numero - 1]} de ${partes.ano}` : '';
}

export function periodoAnalisado(referencia) {
    const meses = referencia?.mesesAnalisados ?? [];
    if (meses.length === 0) {
        return '';
    }
    return `${nomeDoMes(meses[0])} a ${nomeDoMes(meses[meses.length - 1])}`;
}

export function mensagemSemDados(motivo, referencia) {
    const periodo = periodoAnalisado(referencia);
    const quando = periodo ? ` (${periodo})` : '';
    if (motivo === 'sem-entradas') {
        return `Não há entradas registradas nos últimos 3 meses${quando}. A análise precisa da sua renda para calcular os indicadores.`;
    }
    return `Ainda não há lançamentos nos últimos 3 meses${quando}. Registre suas entradas e saídas para ver a análise.`;
}

export function formatarPercentual(valor) {
    if (typeof valor !== 'number' || !Number.isFinite(valor)) {
        return '—';
    }
    return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function maiorValorDaProjecao(projecao) {
    return projecao.reduce((maior, mes) => Math.max(maior, mes.entradas, mes.saidas), 0);
}