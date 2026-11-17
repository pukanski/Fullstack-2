import { useState } from 'react';

export default function useFormulario(valoresIniciais, validar, { dependencias = {}, formatadores = {} } = {}) {
    const [valores, setValores] = useState(valoresIniciais);
    const [erros, setErros] = useState({});

    function alterar(campo, valorDigitado) {
        const formatar = formatadores[campo];
        const valor = formatar ? formatar(valorDigitado) : valorDigitado;
        const novos = { ...valores, [campo]: valor };
        const resultado = validar(novos);

        setValores(novos);
        setErros((atuais) => {
            const proximos = { ...atuais };
            if (atuais[campo]) proximos[campo] = resultado[campo];
            for (const ligado of dependencias[campo] ?? []) {
                if (novos[ligado]) proximos[ligado] = resultado[ligado];
            }
            return proximos;
        });
    }

    function sair(campo) {
        if (!valores[campo]) return;
        const mensagem = validar(valores)[campo];
        setErros((atuais) => ({ ...atuais, [campo]: mensagem }));
    }

    function validarTudo() {
        const resultado = validar(valores);
        setErros(resultado);
        return Object.keys(valores).filter((campo) => resultado[campo]);
    }

    function aplicarErrosApi(campos = {}) {
        const conhecidos = Object.keys(valores).filter((campo) => typeof campos[campo] === 'string');
        if (conhecidos.length) {
            setErros((atuais) => ({
                ...atuais,
                ...Object.fromEntries(conhecidos.map((campo) => [campo, campos[campo]])),
            }));
        }
        return conhecidos;
    }

    function campo(nome, dica = ' ') {
        return {
            id: nome,
            name: nome,
            value: valores[nome],
            onChange: (evento) => alterar(nome, evento.target.value),
            onBlur: () => sair(nome),
            error: Boolean(erros[nome]),
            helperText: erros[nome] || dica,
        };
    }

    return { valores, erros, campo, validarTudo, aplicarErrosApi };
}

export function focarCampo(nome) {
    document.getElementById(nome)?.focus();
}