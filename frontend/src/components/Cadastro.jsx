import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import useFormulario, { focarCampo } from '../hooks/useFormulario.js';
import { extrairErroApi } from '../services/api.js';
import { cadastrar } from '../services/auth.js';
import { mascararCpf, validarCadastro } from '../utils/validacao.js';
import CampoSenha from './CampoSenha.jsx';
import TelaAutenticacao from './TelaAutenticacao.jsx';

const VAZIO = { nome: '', email: '', cpf: '', senha: '', confirmacaoSenha: '' };

export default function Cadastro() {
    const navigate = useNavigate();
    const { valores, campo, validarTudo, aplicarErrosApi } = useFormulario(VAZIO, validarCadastro, {
        dependencias: { senha: ['confirmacaoSenha'] },
        formatadores: { cpf: mascararCpf },
    });
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
            const email = valores.email.trim().toLowerCase();
            await cadastrar({ ...valores, nome: valores.nome.trim(), email });
            navigate('/login', {
                replace: true,
                state: {
                    email,
                    mensagem: 'Cadastro realizado! Entre com seu e-mail e senha.',
                    tipo: 'success',
                },
            });
        } catch (erro) {
            const { mensagem, campos } = extrairErroApi(erro, 'Não foi possível concluir o cadastro.');
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
            titulo="Criar conta"
            subtitulo="Comece a organizar suas finanças"
            rodape={
                <>
                    Já tem conta?{' '}
                    <Link component={RouterLink} to="/login">
                        Entrar
                    </Link>
                </>
            }
        >
            <Stack component="form" noValidate onSubmit={enviar} spacing={1}>
                {erroGeral && (
                    <Alert severity="error" sx={{ mb: 1 }}>
                        {erroGeral}
                    </Alert>
                )}

                <TextField
                    {...campo('nome')}
                    label="Nome completo"
                    autoComplete="name"
                    autoFocus
                    fullWidth
                    required
                    slotProps={{ htmlInput: { maxLength: 120 } }}
                />
                <TextField
                    {...campo('email')}
                    label="E-mail"
                    type="email"
                    autoComplete="email"
                    fullWidth
                    required
                    slotProps={{ htmlInput: { maxLength: 160 } }}
                />
                <TextField
                    {...campo('cpf')}
                    label="CPF"
                    placeholder="000.000.000-00"
                    fullWidth
                    required
                    slotProps={{ htmlInput: { inputMode: 'numeric', maxLength: 14 } }}
                />
                <CampoSenha
                    {...campo('senha', 'Mínimo de 8 caracteres, com letras e números.')}
                    label="Senha"
                    autoComplete="new-password"
                    fullWidth
                    required
                />
                <CampoSenha
                    {...campo('confirmacaoSenha')}
                    label="Confirme a senha"
                    autoComplete="new-password"
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
                    {enviando ? 'Cadastrando...' : 'Criar conta'}
                </Button>
            </Stack>
        </TelaAutenticacao>
    );
}