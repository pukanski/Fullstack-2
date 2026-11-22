import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import api, { extrairErroApi } from '../services/api.js';
import { primeiroNome, principaisCategorias, proximasFaturas } from '../utils/dashboard.js';
import { lerFaturas, nomeDaReferencia } from '../utils/faturas.js';
import { formatarData, formatarMoeda, formatarPercentual } from '../utils/formatacao.js';

function corDoSaldo(valor) {
    if (valor > 0) return 'success.main';
    if (valor < 0) return 'error.main';
    return 'text.primary';
}

function ler(resultado, transformar, mensagemPadrao) {
    if (resultado.status === 'fulfilled') {
        return { dados: transformar(resultado.value.data), erro: '' };
    }
    return { dados: null, erro: extrairErroApi(resultado.reason, mensagemPadrao).mensagem };
}

function Secao({ titulo, acao, parte, children }) {
    return (
        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="h6" component="h2">{titulo}</Typography>
                {acao}
            </Box>
            {parte.erro ? <Alert severity="error">{parte.erro}</Alert> : children}
        </Paper>
    );
}

function ResumoDoMes({ parte }) {
    if (parte.erro) {
        return <Alert severity="error">{parte.erro}</Alert>;
    }

    const { totais } = parte.dados;
    const cartoes = [
        { titulo: 'Entradas do mês', valor: totais.entradas, cor: 'success.main' },
        { titulo: 'Saídas do mês', valor: totais.saidas, cor: 'error.main' },
        { titulo: 'Saldo do mês', valor: totais.saldo, cor: corDoSaldo(totais.saldo) },
    ];

    return (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
            {cartoes.map(({ titulo, valor, cor }) => (
                <Paper key={titulo} variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>{titulo}</Typography>
                    <Typography variant="h5" component="p" sx={{ fontWeight: 700, color: cor }}>
                        {formatarMoeda(valor)}
                    </Typography>
                </Paper>
            ))}
        </Box>
    );
}

function PrincipaisCategorias({ parte }) {
    const categorias = parte.dados ?? [];
    const maximo = categorias.reduce((maior, categoria) => Math.max(maior, categoria.total), 0);

    return (
        <Secao
            titulo="Principais gastos do mês"
            parte={parte}
            acao={<Button size="small" component={RouterLink} to="/relatorios">Ver relatórios</Button>}
        >
            {categorias.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Nenhuma saída registrada neste mês.</Typography>
            ) : (
                <Stack spacing={1.5}>
                    {categorias.map((categoria) => (
                        <Box key={categoria.categoriaId}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>{categoria.nome}</Typography>
                                <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                    {formatarMoeda(categoria.total)}
                                    <Box component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                                        {formatarPercentual(categoria.percentual)}
                                    </Box>
                                </Typography>
                            </Box>
                            <Box sx={{ bgcolor: 'action.hover', borderRadius: 1, height: 10 }}>
                                <Box
                                    sx={{
                                        width: `${maximo > 0 ? (categoria.total / maximo) * 100 : 0}%`,
                                        bgcolor: 'error.main',
                                        height: '100%',
                                        borderRadius: 1,
                                    }}
                                />
                            </Box>
                        </Box>
                    ))}
                </Stack>
            )}
        </Secao>
    );
}

function ProximaFatura({ parte }) {
    const faturas = parte.dados ?? [];
    const [primeira, ...outras] = faturas;

    return (
        <Secao
            titulo="Próxima fatura"
            parte={parte}
            acao={<Button size="small" component={RouterLink} to="/faturas">Ver faturas</Button>}
        >
            {!primeira ? (
                <Stack spacing={1} sx={{ alignItems: 'flex-start' }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Nenhum cartão de crédito cadastrado.
                    </Typography>
                    <Button size="small" variant="outlined" component={RouterLink} to="/fontes-destinos">
                        Cadastrar cartão
                    </Button>
                </Stack>
            ) : (
                <Stack spacing={1.5}>
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontWeight: 600 }}>{primeira.cartao}</Typography>
                            <Chip
                                label={primeira.situacao === 'fechada' ? 'Fechada' : 'Aberta'}
                                color={primeira.situacao === 'fechada' ? 'warning' : 'default'}
                                variant="outlined"
                                size="small"
                            />
                        </Box>
                        <Typography variant="h4" component="p" sx={{ fontWeight: 700, my: 0.5 }}>
                            {formatarMoeda(primeira.total)}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            Vence em {formatarData(primeira.vencimento)}
                        </Typography>
                    </Box>
                    {outras.length > 0 && (
                        <>
                            <Divider />
                            <Stack component="ul" spacing={0.75} sx={{ listStyle: 'none', p: 0, m: 0 }}>
                                {outras.map((fatura) => (
                                    <Box
                                        component="li"
                                        key={fatura.cartaoId}
                                        sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}
                                    >
                                        <Typography variant="body2">
                                            {fatura.cartao}
                                            <Box component="span" sx={{ color: 'text.secondary' }}>
                                                {' '}· vence em {formatarData(fatura.vencimento)}
                                            </Box>
                                        </Typography>
                                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                                            {formatarMoeda(fatura.total)}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </>
                    )}
                </Stack>
            )}
        </Secao>
    );
}

export default function Dashboard() {
    const { usuario } = useAuth();
    const [tentativa, setTentativa] = useState(0);
    const [resposta, setResposta] = useState({ tentativa: -1, partes: null });

    const carregando = resposta.tentativa !== tentativa;
    const partes = carregando ? null : resposta.partes;
    const algumErro = partes && Object.values(partes).some((parte) => parte.erro);
    const nome = primeiroNome(usuario?.nome);

    useEffect(() => {
        let ativo = true;
        Promise.allSettled([
            api.get('/lancamentos'),
            api.get('/relatorios/categorias'),
            api.get('/relatorios/faturas', { params: { meses: 1 } }),
        ]).then(([lancamentos, categorias, faturas]) => {
            if (ativo) {
                setResposta({
                    tentativa,
                    partes: {
                        resumo: ler(lancamentos, (dados) => dados, 'Não foi possível carregar o resumo do mês.'),
                        categorias: ler(categorias, (dados) => principaisCategorias(dados), 'Não foi possível carregar as categorias.'),
                        faturas: ler(faturas, (dados) => proximasFaturas(lerFaturas(dados).cartoes), 'Não foi possível carregar as faturas.'),
                    },
                });
            }
        });
        return () => {
            ativo = false;
        };
    }, [tentativa]);

    const mesDoResumo = partes?.resumo.dados?.periodo?.inicio?.slice(0, 7);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" component="h1">{nome ? `Olá, ${nome}!` : 'Dashboard'}</Typography>
                        {mesDoResumo && (
                            <Typography sx={{ color: 'text.secondary' }}>
                                Resumo de {nomeDaReferencia(mesDoResumo)}
                            </Typography>
                        )}
                    </Box>
                    <Button variant="contained" component={RouterLink} to="/lancamentos">
                        Ver lançamentos
                    </Button>
                </Box>

                {carregando ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <CircularProgress aria-label="Carregando o resumo do mês" />
                    </Box>
                ) : (
                    <>
                        {algumErro && (
                            <Alert
                                severity="warning"
                                action={
                                    <Button color="inherit" size="small" onClick={() => setTentativa((atual) => atual + 1)}>
                                        Tentar novamente
                                    </Button>
                                }
                            >
                                Parte das informações não pôde ser carregada.
                            </Alert>
                        )}
                        <ResumoDoMes parte={partes.resumo} />
                        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, alignItems: 'stretch' }}>
                            <PrincipaisCategorias parte={partes.categorias} />
                            <ProximaFatura parte={partes.faturas} />
                        </Box>
                    </>
                )}
            </Stack>
        </Container>
    );
}