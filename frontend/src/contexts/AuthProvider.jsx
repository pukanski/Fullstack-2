import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { definirAoSessaoExpirar } from '../services/api.js';
import { buscarUsuarioLogado, entrar } from '../services/auth.js';
import { lerSessao, limparSessao, salvarSessao, salvarUsuario } from '../services/sessao.js';
import { AuthContext } from './AuthContext.js';

const SEM_SESSAO = { token: null, usuario: null };

export default function AuthProvider({ children }) {
    const navigate = useNavigate();
    const [sessao, setSessao] = useState(lerSessao);

    const encerrarSessao = useCallback(() => {
        limparSessao();
        setSessao(SEM_SESSAO);
    }, []);

    const login = useCallback(async (email, senha) => {
        const { token, usuario } = await entrar(email, senha);
        salvarSessao(token, usuario);
        setSessao({ token, usuario });
    }, []);

    const logout = useCallback(() => {
        encerrarSessao();
        navigate('/login', { replace: true });
    }, [encerrarSessao, navigate]);

    useEffect(
        () =>
            definirAoSessaoExpirar(() => {
                const de = `${window.location.pathname}${window.location.search}`;
                encerrarSessao();
                navigate('/login', {
                    replace: true,
                    state: {
                        de,
                        mensagem: 'Sua sessão expirou. Entre novamente para continuar.',
                        tipo: 'warning',
                    },
                });
            }),
        [encerrarSessao, navigate],
    );

    useEffect(() => {
        if (!sessao.token) {
            return undefined;
        }
        let ativo = true;
        buscarUsuarioLogado()
            .then((usuario) => {
                if (ativo && usuario && typeof usuario === 'object') {
                    salvarUsuario(usuario);
                    setSessao((atual) => (atual.token ? { ...atual, usuario } : atual));
                }
            })
            .catch(() => {});
        return () => {
            ativo = false;
        };
    }, [sessao.token]);

    const valor = useMemo(
        () => ({
            usuario: sessao.usuario,
            token: sessao.token,
            autenticado: Boolean(sessao.token),
            login,
            logout,
        }),
        [sessao, login, logout],
    );

    return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}