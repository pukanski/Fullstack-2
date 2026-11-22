function paraISO(data) {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
}

export function hojeISO(referencia = new Date()) {
    return paraISO(referencia);
}

export function inicioDoMes(referencia = new Date()) {
    return paraISO(new Date(referencia.getFullYear(), referencia.getMonth(), 1));
}

export function fimDoMes(referencia = new Date()) {
    return paraISO(new Date(referencia.getFullYear(), referencia.getMonth() + 1, 0));
}