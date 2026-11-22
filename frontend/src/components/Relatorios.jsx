import {
    Alert, Box, Button, CircularProgress, Container, Paper, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { useState } from 'react';
import api, { extrairErroApi } from '../services/api.js';

const moeda = (v) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const iso = (d) => d.toISOString().slice(0, 10);

function periodoInicial() {
    const hoje = new Date();
    return { inicio: iso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), fim: iso(hoje) };
}

function variacao(linha) {
    if (linha.variacaoPercentual != null) return Number(linha.variacaoPercentual);
    const ant = Number(linha.totalAnterior ?? 0);
    return ant === 0 ? null : ((Number(linha.total) - ant) / ant) * 100;
}

function Variacao({ valor }) {
    if (valor == null) return <Typography variant="body2" color="text.secondary">—</Typography>;

    const cor = valor > 0 ? 'error.main' : valor < 0 ? 'success.main' : 'text.secondary';
    return (
        <Typography variant="body2" sx={{ color: cor }}>
            {valor > 0 ? '+' : ''}{valor.toFixed(1).replace('.', ',')}%
        </Typography>
    );
}

function Barra({ valor, maximo, cor }) {
    const largura = maximo > 0 ? (Number(valor ?? 0) / maximo) * 100 : 0;
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{ flex: 1, bgcolor: 'action.hover', borderRadius: 1, height: 14 }}>
                <Box sx={{ width: `${largura}%`, bgcolor: cor, height: '100%', borderRadius: 1 }} />
            </Box>
            <Typography variant="caption" sx={{ minWidth: 90, textAlign: 'right' }}>{moeda(valor)}</Typography>
        </Box>
    );
}

export default function Relatorios() {
    const [periodo, setPeriodo] = useState(periodoInicial);
    const [dados, setDados] = useState(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');

    const gerar = async (e) => {
        e.preventDefault();
        if (!periodo.inicio || !periodo.fim || periodo.inicio > periodo.fim) {
            setErro('Informe um período válido (a data inicial não pode ser maior que a final).');
            return;
        }
        setCarregando(true);
        setErro('');
        try {
            const { data } = await api.get('/relatorios/categorias', { params: periodo });
            const lista = data.saidas?.categorias ?? [];
            setDados([...lista].sort((a, b) => b.total - a.total));
        } catch (err) {
            setDados(null);
            setErro(extrairErroApi(err).mensagem);
        } finally {
            setCarregando(false);
        }
    };

    const maximo = dados
        ? Math.max(0, ...dados.map((d) => Math.max(Number(d.total), Number(d.totalAnterior ?? 0))))
        : 0;

    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 3 }}>Relatórios</Typography>
            <Typography variant="h6" component="h2" sx={{ mb: 2 }}>Saídas por categoria</Typography>

            <Paper component="form" onSubmit={gerar} sx={{ p: 2, mb: 3 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    {[['inicio', 'Data inicial'], ['fim', 'Data final']].map(([campo, label]) => (
                        <TextField
                            key={campo} type="date" label={label} value={periodo[campo]}
                            onChange={(e) => setPeriodo((p) => ({ ...p, [campo]: e.target.value }))}
                            slotProps={{ inputLabel: { shrink: true } }} fullWidth
                        />
                    ))}
                    <Button type="submit" variant="contained" disabled={carregando} sx={{ minWidth: 140 }}>
                        Gerar relatório
                    </Button>
                </Stack>
            </Paper>

            {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
            {carregando && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}
            {dados?.length === 0 && <Alert severity="info">Nenhuma saída encontrada no período.</Alert>}

            {dados?.length > 0 && !carregando && (
                <>
                    <TableContainer component={Paper} sx={{ mb: 3 }}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Categoria</TableCell>
                                    <TableCell align="right">Saídas</TableCell>
                                    <TableCell align="right">% do total</TableCell>
                                    <TableCell align="right">Período anterior</TableCell>
                                    <TableCell align="right">Variação</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dados.map((d) => (
                                    <TableRow key={d.categoriaId ?? d.nome} hover>
                                        <TableCell>{d.nome}</TableCell>
                                        <TableCell align="right">{moeda(d.total)}</TableCell>
                                        <TableCell align="right">{Number(d.percentual ?? 0).toFixed(1).replace('.', ',')}%</TableCell>
                                        <TableCell align="right">{moeda(d.totalAnterior)}</TableCell>
                                        <TableCell align="right"><Variacao valor={variacao(d)} /></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Paper sx={{ p: 2 }}>
                        <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                            <Typography variant="caption">
                                <Box component="span" sx={{ color: 'primary.main' }}>■</Box> Período selecionado
                            </Typography>
                            <Typography variant="caption">
                                <Box component="span" sx={{ color: 'grey.500' }}>■</Box> Período anterior
                            </Typography>
                        </Stack>
                        {dados.map((d) => (
                            <Box key={d.categoriaId ?? d.nome} sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ mb: 0.5 }}>{d.nome}</Typography>
                                <Barra valor={d.total} maximo={maximo} cor="primary.main" />
                                <Barra valor={d.totalAnterior} maximo={maximo} cor="grey.500" />
                            </Box>
                        ))}
                    </Paper>
                </>
            )}
        </Container>
    );
}