import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import useFormulario, { focarCampo } from '../hooks/useFormulario.js';
import { extrairErroApi } from '../services/api.js';
import { validarLogin } from '../utils/validacao.js';
import CampoSenha from './CampoSenha.jsx';
import TelaAutenticacao from './TelaAutenticacao.jsx';

export default function Login() {
    const { login } = useAuth();
    const location = useLocation();
    const aviso = location.state?.mensagem
        ? { texto: location.state.mensagem, tipo: location.state.tipo ?? 'info' }
        : null;

    const { valores, campo, validarTudo, aplicarErrosApi } = useFormulario(
        { email: location.state?.email ?? '', senha: '' },
        validarLogin,
    );
    const [erroGeral, setErroGeral] = useState('');
    const [enviando, setEnviando] = useState(false);

    async function enviar(evento) {
        evento.preventDefault();
        setErroGeral('');

        const comErro = validarTudo();
        if (comErro.length) {
            focarCampo(comErro[0]);
            return;
        }

        setEnviando(true);
        try {
            await login(valores.email.trim().toLowerCase(), valores.senha);
        } catch (erro) {
            const { mensagem, campos } = extrairErroApi(erro, 'Não foi possível entrar.');
            const marcados = aplicarErrosApi(campos);
            if (marcados.length) {
                focarCampo(marcados[0]);
            } else {
                setErroGeral(mensagem);
            }
            setEnviando(false);
        }
    }

    return (
        <TelaAutenticacao
            titulo="Entrar"
            subtitulo="Acesse seu controle financeiro"
            rodape={
                <>
                    Ainda não tem conta?{' '}
                    <Link component={RouterLink} to="/cadastro">
                        Cadastre-se
                    </Link>
                </>
            }
        >
            <Stack component="form" noValidate onSubmit={enviar} spacing={1}>
                {aviso && !erroGeral && (
                    <Alert severity={aviso.tipo} sx={{ mb: 1 }}>
                        {aviso.texto}
                    </Alert>
                )}
                {erroGeral && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                        {erroGeral}
                    </Alert>
                )}

                <TextField
                    {...campo('email')}
                    label="E-mail"
                    type="email"
                    autoComplete="email"
                    autoFocus={!valores.email}
                    fullWidth
                    required
                />
                <CampoSenha
                    {...campo('senha')}
                    label="Senha"
                    autoComplete="current-password"
                    autoFocus={Boolean(valores.email)}
                    fullWidth
                    required
                />

                <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={enviando}
                    startIcon={enviando ? <CircularProgress size={18} color="inherit" /> : null}
                >
                    {enviando ? 'Entrando...' : 'Entrar'}
                </Button>
            </Stack>
        </TelaAutenticacao>
    );
}