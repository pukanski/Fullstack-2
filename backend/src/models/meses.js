export function deslocarMes(mes, quantidade) {
    const [ano, numero] = mes.split('-').map(Number);
    const total = ano * 12 + (numero - 1) + quantidade;
    const novoAno = Math.floor(total / 12);
    const novoMes = (total % 12) + 1;
    return `${novoAno}-${String(novoMes).padStart(2, '0')}`;
}

export function ultimoDiaDoMes(mes) {
    const [ano, numero] = mes.split('-').map(Number);
    return new Date(Date.UTC(ano, numero, 0)).getUTCDate();
}

export function nomeDoMes(mes) {
    const [ano, numero] = mes.split('-').map(Number);
    return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
        new Date(Date.UTC(ano, numero - 1, 1)),
    );
}