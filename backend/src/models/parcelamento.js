export function dividirEmCentavos(valor, parcelas) {
    const total = Math.round(valor * 100);
    const base = Math.floor(total / parcelas);
    const resto = total - base * parcelas;

    return Array.from({ length: parcelas }, (_, indice) => {
        const centavos = indice === 0 ? base + resto : base;
        return centavos / 100;
    });
}