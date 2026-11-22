import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import api, { extrairErroApi } from '../services/api.js';
import { formatarData, formatarMoeda } from '../utils/formatacao.js';
import { errosDoPeriodo } from '../utils/lancamentos.js';
import {
    formatarPercentual,
    lerRelatorioFontes,
    maiorValor,
    nomeDoTipoDeFonte,
    periodoDoMes,
    somaDosTotais,
} from '../utils/relatorios.js';

function corDoSaldo(valor) {
    if (valor > 0) return 'success.main';
    if (valor < 0) return 'error.main';
    return 'text.primary';
}

function Barra({ valor, maximo, cor }) {
    const largura = maximo > 0 ? Math.max(0, (valor / maximo) * 100) : 0;
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flex: 1, bgcolor: 'action.hover', borderRadius: 1, height: 14 }}>
                <Box sx={{ width: `${largura}%`, bgcolor: cor, height: '100%', borderRadius: 1 }} />
            </Box>
            <Typography variant="caption" sx={{ minWidth: 96, textAlign: 'right' }}>
                {formatarMoeda(valor)}
            </Typography>
        </Box>
    );
}

function TotaisPorFonte({ titulo, rotuloDaColuna, linhas, cor, mensagemVazia }) {
    const maximo = maiorValor(linhas.map((linha) => linha.total));

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2, mb: 2 }}>
                <Typography variant="h6" component="h3">{titulo}</Typography>
                <Typography sx={{ fontWeight: 700, color: cor }}>{formatarMoeda(somaDosTotais(linhas))}</Typography>
            </Box>

            {linhas.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{mensagemVazia}</Typography>
            ) : (
                <Stack spacing={2}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{rotuloDaColuna}</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell align="right">Total</TableCell>
                                    <TableCell align="right">% do total</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {linhas.map((linha) => (
                                    <TableRow key={linha.fonteDestinoId} hover>
                                        <TableCell>{linha.nome}</TableCell>
                                        <TableCell>
                                            <Chip label={nomeDoTipoDeFonte(linha.tipo)} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatarMoeda(linha.total)}</TableCell>
                                        <TableCell align="right">{formatarPercentual(linha.percentual)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Stack spacing={1.5}>
                        {linhas.map((linha) => (
                            <Box key={linha.fonteDestinoId}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>{linha.nome}</Typography>
                                <Barra valor={linha.total} maximo={maximo} cor={cor} />
                            </Box>
                        ))}
                    </Stack>
                </Stack>
            )}
        </Paper>
    );
}

function SaldoPorConta({ contas }) {
    const maximo = maiorValor(contas.flatMap((conta) => [conta.entradas, conta.saidas]));

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" component="h3" sx={{ mb: 2 }}>Saldo por conta</Typography>

            {contas.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Nenhuma conta cadastrada. Cadastre em Fontes e destinos.
                </Typography>
            ) : (
                <Stack spacing={2}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Conta</TableCell>
                                    <TableCell align="right">Entradas</TableCell>
                                    <TableCell align="right">Saídas</TableCell>
                                    <TableCell align="right">Saldo do período</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {contas.map((conta) => (
                                    <TableRow key={conta.fonteDestinoId} hover>
                                        <TableCell>{conta.nome}</TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatarMoeda(conta.entradas)}</TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatarMoeda(conta.saidas)}</TableCell>
                                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 700, color: corDoSaldo(conta.saldo) }}>
                                            {formatarMoeda(conta.saldo)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Stack direction="row" spacing={3}>
                        <Typography variant="caption">
                            <Box component="span" sx={{ color: 'success.main' }}>■</Box> Entradas
                        </Typography>
                        <Typography variant="caption">
                            <Box component="span" sx={{ color: 'error.main' }}>■</Box> Saídas
                        </Typography>
                    </Stack>
                    <Stack spacing={1.5}>
                        {contas.map((conta) => (
                            <Box key={conta.fonteDestinoId}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>{conta.nome}</Typography>
                                <Stack spacing={0.5}>
                                    <Barra valor={conta.entradas} maximo={maximo} cor="success.main" />
                                    <Barra valor={conta.saidas} maximo={maximo} cor="error.main" />
                                </Stack>
                            </Box>
                        ))}
                    </Stack>
                </Stack>
            )}
        </Paper>
    );
}

export default function RelatorioFontesDestinos() {
    const [periodo, setPeriodo] = useState(() => periodoDoMes());
    const [tentativa, setTentativa] = useState(0);
    const [resposta, setResposta] = useState({ chave: null, dados: null, erro: '' });

    const erros = errosDoPeriodo(periodo);
    const invalido = Object.keys(erros).length > 0;
    const chave = JSON.stringify({ periodo, tentativa });
    const carregando = !invalido && resposta.chave !== chave;
    const dados = resposta.dados;

    useEffect(() => {
        if (invalido) {
            return undefined;
        }
        let ativo = true;
        const consulta = JSON.parse(chave);
        api.get('/relatorios/fontes-destinos', { params: consulta.periodo }).then(
            ({ data }) => {
                if (ativo) {
                    setResposta({ chave, dados: lerRelatorioFontes(data), erro: '' });
                }
            },
            (erro) => {
                if (ativo) {
                    const { mensagem } = extrairErroApi(erro, 'Não foi possível carregar o relatório.');
                    setResposta({ chave, dados: null, erro: mensagem });
                }
            },
        );
        return () => {
            ativo = false;
        };
    }, [chave, invalido]);

    function renderizarConteudo() {
        if (invalido) {
            return <Alert severity="info">Ajuste o período para ver o relatório.</Alert>;
        }

        if (!carregando && resposta.erro) {
            return (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" size="small" onClick={() => setTentativa((atual) => atual + 1)}>
                            Tentar novamente
                        </Button>
                    }
                >
                    {resposta.erro}
                </Alert>
            );
        }

        if (!dados) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress aria-label="Carregando relatório" />
                </Box>
            );
        }

        return (
            <>
                <Box sx={{ height: 4 }}>{carregando && <LinearProgress />}</Box>
                <Typography sx={{ color: 'text.secondary' }}>
                    Período de {formatarData(dados.periodo.inicio)} a {formatarData(dados.periodo.fim)}
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'start' }}>
                    <TotaisPorFonte
                        titulo="Entradas por fonte"
                        rotuloDaColuna="Fonte"
                        linhas={dados.entradas}
                        cor="success.main"
                        mensagemVazia="Nenhuma entrada no período."
                    />
                    <TotaisPorFonte
                        titulo="Saídas por destino"
                        rotuloDaColuna="Destino"
                        linhas={dados.saidas}
                        cor="error.main"
                        mensagemVazia="Nenhuma saída no período."
                    />
                </Box>
                <SaldoPorConta contas={dados.contas} />
            </>
        );
    }

    return (
        <Stack spacing={2}>
            <Box
                sx={{
                    display: 'grid',
                    gap: 2,
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr auto' },
                    alignItems: 'start',
                }}
            >
                <TextField
                    label="De"
                    type="date"
                    size="small"
                    value={periodo.inicio}
                    onChange={(evento) => setPeriodo((atual) => ({ ...atual, inicio: evento.target.value }))}
                    error={Boolean(erros.inicio)}
                    helperText={erros.inicio || ' '}
                    slotProps={{ inputLabel: { shrink: true } }}
                />
                <TextField
                    label="Até"
                    type="date"
                    size="small"
                    value={periodo.fim}
                    onChange={(evento) => setPeriodo((atual) => ({ ...atual, fim: evento.target.value }))}
                    error={Boolean(erros.fim)}
                    helperText={erros.fim || ' '}
                    slotProps={{ inputLabel: { shrink: true } }}
                />
                <Button variant="outlined" onClick={() => setPeriodo(periodoDoMes())} sx={{ height: 40 }}>
                    Mês atual
                </Button>
            </Box>
            {renderizarConteudo()}
        </Stack>
    );
}