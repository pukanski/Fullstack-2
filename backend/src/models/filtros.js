export function montarWhere(usuarioId, filtros) {
    const condicoes = ['l.usuario_id = $1', 'l.data BETWEEN $2 AND $3'];
    const parametros = [usuarioId, filtros.inicio, filtros.fim];

    const acrescentar = (coluna, valor) => {
        parametros.push(valor);
        condicoes.push(`${coluna} = $${parametros.length}`);
    };

    if (filtros.tipo) acrescentar('l.tipo', filtros.tipo);
    if (filtros.categoriaId) acrescentar('l.categoria_id', filtros.categoriaId);
    if (filtros.fonteDestinoId) acrescentar('l.fonte_destino_id', filtros.fonteDestinoId);

    return { where: condicoes.join(' AND '), parametros };
}