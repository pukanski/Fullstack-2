const OBRIGATORIO = 'Campo obrigatório.';
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function somenteDigitos(valor) {
    return String(valor ?? '').replace(/\D/g, '');
}

export function mascararCpf(valor) {
    return somenteDigitos(valor)
        .slice(0, 11)
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2');
}

export function cpfValido(cpf) {
    const d = somenteDigitos(cpf);

    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) {
        return false;
    }

    const digito = (tamanho) => {
        let soma = 0;
        for (let i = 0; i < tamanho; i++) {
            soma += Number(d[i]) * (tamanho + 1 - i);
        }
        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto;
    };

    return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

function erroEmail(email) {
    const valor = String(email ?? '').trim();
    if (!valor) return OBRIGATORIO;
    if (valor.length > 160) return 'O e-mail deve ter no máximo 160 caracteres.';
    if (!REGEX_EMAIL.test(valor)) return 'E-mail inválido.';
    return undefined;
}

function erroSenha(senha) {
    const valor = String(senha ?? '');
    if (!valor) return OBRIGATORIO;
    if (valor.length < 8) return 'A senha deve ter no mínimo 8 caracteres.';
    if (!/\p{L}/u.test(valor) || !/\d/.test(valor)) return 'A senha deve conter letras e números.';
    if (new TextEncoder().encode(valor).length > 72) return 'A senha deve ter no máximo 72 caracteres.';
    return undefined;
}

function semVazios(erros) {
    return Object.fromEntries(Object.entries(erros).filter(([, mensagem]) => mensagem));
}

export function validarLogin({ email, senha }) {
    return semVazios({
        email: erroEmail(email),
        senha: senha ? undefined : OBRIGATORIO,
    });
}

export function validarCadastro({ nome, email, cpf, senha, confirmacaoSenha }) {
    const nomeLimpo = String(nome ?? '').trim();
    const digitosCpf = somenteDigitos(cpf);

    let erroNome;
    if (!nomeLimpo) erroNome = OBRIGATORIO;
    else if (nomeLimpo.length < 2) erroNome = 'O nome deve ter pelo menos 2 caracteres.';
    else if (nomeLimpo.length > 120) erroNome = 'O nome deve ter no máximo 120 caracteres.';

    let erroCpf;
    if (!digitosCpf) erroCpf = OBRIGATORIO;
    else if (!cpfValido(digitosCpf)) erroCpf = 'CPF inválido.';

    let erroConfirmacao;
    if (!confirmacaoSenha) erroConfirmacao = OBRIGATORIO;
    else if (confirmacaoSenha !== senha) erroConfirmacao = 'As senhas não conferem.';

    return semVazios({
        nome: erroNome,
        email: erroEmail(email),
        cpf: erroCpf,
        senha: erroSenha(senha),
        confirmacaoSenha: erroConfirmacao,
    });
}