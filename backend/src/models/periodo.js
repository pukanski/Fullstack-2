const FUSO_HORARIO = 'America/Sao_Paulo';

const doisDigitos = (numero) => String(numero).padStart(2, '0');

export function hojeEmSaoPaulo(agora = new Date()) {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: FUSO_HORARIO,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(agora);
}

export function mesCorrente(agora = new Date()) {
    const [ano, mes] = hojeEmSaoPaulo(agora).split('-').map(Number);
    const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
    return {
        inicio: `${ano}-${doisDigitos(mes)}-01`,
        fim: `${ano}-${doisDigitos(mes)}-${doisDigitos(ultimoDia)}`,
    };
}