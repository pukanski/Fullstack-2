import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import api, { extrairErroApi } from '../services/api.js';
import { formatarMoeda } from '../utils/formatacao.js';
import {
    formatarPercentual,
    infoDaFaixa,
    maiorValorDaProjecao,
    mensagemSemDados,
    mesAbreviado,
    nomeDoMes,
    periodoAnalisado,
} from '../utils/saudeFinanceira.js';

const ALTURA_DO_GRAFICO = 160;

const primeiraMaiuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

function corDoValor(valor) {
    if (valor > 0) return 'success.main';
    if (valor < 0) return 'error.main';
    return 'text.primary';
}

function CartaoIndicador({ titulo, valor, faixa, descricao }) {
    const { rotulo, cor } = infoDaFaixa(faixa);

    return (
        <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{titulo}</Typography>
                {faixa && <Chip label={rotulo} color={cor} size="small" />}
            </Box>
            <Typography variant="h5" component="p" sx={{ fontWeight: 700, mt: 1 }}>{valor}</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>{descricao}</Typography>
        </Paper>
    );
}

function Indicadores({ dados }) {
    const { taxaPoupanca, comprometimentoCartoes, parcelasFuturas } = dados.indicadores;
    const periodo = periodoAnalisado(dados.referencia);

    let descricaoDasParcelas = 'Nenhuma parcela de cartão nos próximos 6 meses.';
    if (parcelasFuturas.ate) {
        descricaoDasParcelas = `Parcelas de cartão até ${nomeDoMes(parcelasFuturas.ate)}.`;
        if (parcelasFuturas.mesMaisPesado) {
            descricaoDasParcelas += ` Mês mais pesado: ${nomeDoMes(parcelasFuturas.mesMaisPesado.mes)}, com ${formatarMoeda(parcelasFuturas.mesMaisPesado.valor)}.`;
        }
    }

    return (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
            <CartaoIndicador
                titulo="Renda média mensal"
                valor={formatarMoeda(dados.rendaMediaMensal)}
                descricao={`Média das entradas de ${periodo}.`}
            />
            <CartaoIndicador
                titulo="Taxa de poupança"
                valor={formatarPercentual(taxaPoupanca.valor)}
                faixa={taxaPoupanca.faixa}
                descricao="Quanto da renda sobrou depois de todas as saídas no período analisado."
            />
            <CartaoIndicador
                titulo="Comprometimento com cartões"
                valor={formatarPercentual(comprometimentoCartoes.valor)}
                faixa={comprometimentoCartoes.faixa}
                descricao={`Parte da renda usada pelas faturas dos próximos 3 meses (média de ${formatarMoeda(comprometimentoCartoes.faturaMedia)} por mês).`}
            />
            <CartaoIndicador
                titulo="Parcelas futuras"
                valor={formatarMoeda(parcelasFuturas.total)}
                faixa={parcelasFuturas.faixa}
                descricao={descricaoDasParcelas}
            />
        </Box>
    );
}

function CategoriasForaDaCurva({ categorias }) {
    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 1 }}>Categorias acima da média</Typography>
            {categorias.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Nenhuma categoria está bem acima da sua média dos meses anteriores.
                </Typography>
            ) : (
                <Stack spacing={1.5}>
                    {categorias.map((categoria) => (
                        <Box
                            key={categoria.categoriaId}
                            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}
                        >
                            <Box>
                                <Typography sx={{ fontWeight: 600 }}>{categoria.nome}</Typography>
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                    {formatarMoeda(categoria.mesAtual)} neste mês, média de {formatarMoeda(categoria.media)}
                                </Typography>
                            </Box>
                            <Chip label={`+${formatarPercentual(categoria.variacaoPercentual)}`} color="warning" size="small" />
                        </Box>
                    ))}
                </Stack>
            )}
        </Paper>
    );
}

function Projecao({ projecao }) {
    const maximo = maiorValorDaProjecao(projecao);
    const altura = (valor) => (maximo > 0 ? `${Math.max(0, (valor / maximo) * 100)}%` : '0%');

    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" component="h2">Projeção dos próximos 6 meses</Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                Considera a sua renda média, a média das saídas à vista e as faturas de cartão já previstas.
            </Typography>

            <Stack direction="row" spacing={3} sx={{ mb: 1 }}>
                <Typography variant="caption">
                    <Box component="span" sx={{ color: 'success.main' }}>■</Box> Entradas
                </Typography>
                <Typography variant="caption">
                    <Box component="span" sx={{ color: 'error.main' }}>■</Box> Saídas
                </Typography>
            </Stack>

            <Box
                role="img"
                aria-label="Gráfico de colunas com as entradas e saídas previstas para os próximos 6 meses"
                sx={{ display: 'grid', gridTemplateColumns: `repeat(${projecao.length}, 1fr)`, gap: 1, mb: 3 }}
            >
                {projecao.map((mes) => (
                    <Box key={mes.mes} sx={{ textAlign: 'center' }}>
                        <Box
                            sx={{
                                height: ALTURA_DO_GRAFICO,
                                display: 'flex',
                                alignItems: 'flex-end',
                                justifyContent: 'center',
                                gap: 0.5,
                                borderBottom: 1,
                                borderColor: 'divider',
                            }}
                        >
                            <Box sx={{ width: '32%', maxWidth: 28, height: altura(mes.entradas), bgcolor: 'success.main', borderRadius: '4px 4px 0 0' }} />
                            <Box sx={{ width: '32%', maxWidth: 28, height: altura(mes.saidas), bgcolor: 'error.main', borderRadius: '4px 4px 0 0' }} />
                        </Box>
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>{mesAbreviado(mes.mes)}</Typography>
                    </Box>
                ))}
            </Box>

            <TableContainer>
                <Table size="small" sx={{ minWidth: 560 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Mês</TableCell>
                            <TableCell align="right">Entradas</TableCell>
                            <TableCell align="right">Saídas</TableCell>
                            <TableCell align="right">Resultado</TableCell>
                            <TableCell align="right">Acumulado</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {projecao.map((mes) => (
                            <TableRow key={mes.mes} hover>
                                <TableCell>{primeiraMaiuscula(nomeDoMes(mes.mes))}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatarMoeda(mes.entradas)}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>{formatarMoeda(mes.saidas)}</TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 700, color: corDoValor(mes.resultado) }}>
                                    {formatarMoeda(mes.resultado)}
                                </TableCell>
                                <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: corDoValor(mes.acumulado) }}>
                                    {formatarMoeda(mes.acumulado)}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}

function Dicas({ dicas }) {
    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Dicas</Typography>
            {dicas.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Nenhuma dica no momento.</Typography>
            ) : (
                <Stack spacing={1.5}>
                    {dicas.map((dica) => (
                        <Alert key={`${dica.indicador}-${dica.texto}`} severity={infoDaFaixa(dica.faixa).cor} variant="outlined">
                            {dica.texto}
                        </Alert>
                    ))}
                </Stack>
            )}
        </Paper>
    );
}

export default function SaudeFinanceira() {
    const [tentativa, setTentativa] = useState(0);
    const [resposta, setResposta] = useState({ tentativa: -1, dados: null, erro: '' });

    const carregando = resposta.tentativa !== tentativa;
    const dados = carregando ? null : resposta.dados;

    useEffect(() => {
        let ativo = true;
        api.get('/saude-financeira').then(
            ({ data }) => {
                if (ativo) {
                    setResposta({ tentativa, dados: data, erro: '' });
                }
            },
            (erro) => {
                if (ativo) {
                    const { mensagem } = extrairErroApi(erro, 'Não foi possível carregar a análise.');
                    setResposta({ tentativa, dados: null, erro: mensagem });
                }
            },
        );
        return () => {
            ativo = false;
        };
    }, [tentativa]);

    function renderizarConteudo() {
        if (carregando) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress aria-label="Carregando a análise" />
                </Box>
            );
        }

        if (resposta.erro) {
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

        if (!dados?.dadosSuficientes) {
            return (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 600 }}>Ainda não dá para analisar.</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 2 }}>
                        {mensagemSemDados(dados?.motivo, dados?.referencia)}
                    </Typography>
                    <Button variant="contained" component={RouterLink} to="/lancamentos">
                        Ir para Lançamentos
                    </Button>
                </Paper>
            );
        }

        return (
            <>
                <Indicadores dados={dados} />
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, alignItems: 'start' }}>
                    <Projecao projecao={dados.projecao} />
                    <Stack spacing={2}>
                        <Dicas dicas={dados.dicas} />
                        <CategoriasForaDaCurva categorias={dados.indicadores.categoriasForaDaCurva} />
                    </Stack>
                </Box>
            </>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" component="h1">Saúde financeira</Typography>
                    {dados?.referencia && (
                        <Typography sx={{ color: 'text.secondary' }}>
                            Análise de {periodoAnalisado(dados.referencia)} e projeção dos próximos 6 meses.
                        </Typography>
                    )}
                </Box>
                <Alert severity="info">
                    <AlertTitle>Conteúdo educativo</AlertTitle>
                    Os indicadores, a projeção e as dicas desta página são calculados automaticamente a partir dos seus
                    lançamentos. Eles servem para você entender seus hábitos e não são recomendação financeira.
                </Alert>
                {renderizarConteudo()}
            </Stack>
        </Container>
    );
}