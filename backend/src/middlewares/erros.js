export class ErroHttp extends Error {
    constructor(status, mensagem, campos = {}) {
        super(mensagem);
        this.status = status;
        this.campos = campos;
    }
}

export function rotaNaoEncontrada(req, res) {
    res.status(404).json({ erro: 'Rota não encontrada.', campos: {} });
}

export function tratarErros(erro, req, res, next) {
    if (res.headersSent) {
        return next(erro);
    }

    if (erro instanceof ErroHttp) {
        return res.status(erro.status).json({ erro: erro.message, campos: erro.campos });
    }

    if (erro.type === 'entity.parse.failed') {
        return res.status(400).json({ erro: 'JSON inválido no corpo da requisição.', campos: {} });
    }
    if (erro.type === 'entity.too.large') {
        return res.status(413).json({ erro: 'Corpo da requisição grande demais.', campos: {} });
    }

    console.error('Erro não tratado:', erro);
    return res.status(500).json({ erro: 'Erro interno do servidor.', campos: {} });
}