import { Add, Delete, Edit, Visibility } from '@mui/icons-material';
import {
    Alert, Box, Button, Checkbox, Chip, CircularProgress, Container, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, FormControlLabel, IconButton, LinearProgress, MenuItem,
    Pagination, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, TextField, Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';
import api, { extrairErroApi } from '../services/api.js';
import { hojeISO } from '../utils/datas.js';
import { formatarData, formatarMoeda } from '../utils/formatacao.js';
import { errosDoPeriodo, filtrosDoMes, parametrosDaBusca, rotuloDaParcela } from '../utils/lancamentos.js';
import FiltrosLancamentos from './FiltrosLancamentos.jsx';
import TotaisLancamentos from './TotaisLancamentos.jsx';

const dia = (d) => String(d).slice(0, 10);
const SEM_ERRO = { msg: '', campos: {} };

const FORM_INICIAL = () => ({
    tipo: 'saida',
    descricao: '',
    valor: '',
    data: hojeISO(),
    categoriaId: '',
    fonteDestinoId: '',
    parcelas: 1,
});

export default function Lancamentos() {
    const [dados, setDados] = useState(null);
    const [opcoes, setOpcoes] = useState({ categorias: [], fontes: [] });
    const [filtros, setFiltros] = useState(() => filtrosDoMes());
    const [pagina, setPagina] = useState(1);
    const [carregando, setCarregando] = useState(true);
    const [erroPagina, setErroPagina] = useState('');
    const [dialogo, setDialogo] = useState(null);
    const [form, setForm] = useState(FORM_INICIAL);
    const [todasParcelas, setTodasParcelas] = useState(false);
    const [erro, setErro] = useState(SEM_ERRO);
    const [ocupado, setOcupado] = useState(false);
    const ultimaBusca = useRef(0);
    const { modo, item } = dialogo ?? {};

    const errosDosFiltros = errosDoPeriodo(filtros);
    const periodoValido = Object.keys(errosDosFiltros).length === 0;

    const carregar = useCallback(async () => {
        if (!periodoValido) return;
        const numero = ultimaBusca.current + 1;
        ultimaBusca.current = numero;
        setCarregando(true);
        setErroPagina('');
        try {
            const { data } = await api.get('/lancamentos', { params: parametrosDaBusca({ ...filtros, pagina }) });
            if (numero === ultimaBusca.current) setDados(data);
        } catch (e) {
            if (numero === ultimaBusca.current) {
                setDados(null);
                setErroPagina(extrairErroApi(e, 'Não foi possível carregar os lançamentos.').mensagem);
            }
        } finally {
            if (numero === ultimaBusca.current) setCarregando(false);
        }
    }, [filtros, pagina, periodoValido]);

    useEffect(() => { carregar(); }, [carregar]);

    useEffect(() => {
        Promise.all([api.get('/categorias'), api.get('/fontes-destinos')])
            .then(([cat, fon]) => setOpcoes({ categorias: cat.data, fontes: fon.data }))
            .catch((e) => setErroPagina(extrairErroApi(e).mensagem));
    }, []);

    const alterarFiltros = (novos) => {
        setFiltros(novos);
        setPagina(1);
    };

    const abrir = (novoModo, l = null) => {
        setDialogo({ modo: novoModo, item: l });
        setErro(SEM_ERRO);
        setTodasParcelas(false);
        if (novoModo === 'criar') {
            setForm(FORM_INICIAL());
        } else {
            setForm({
                tipo: l.tipo,
                descricao: l.descricao ?? '',
                valor: Number(l.valor),
                data: dia(l.data),
                categoriaId: l.categoriaId,
                fonteDestinoId: l.fonteDestinoId,
                parcelas: l.totalParcelas ?? 1,
            });
        }
    };
    const fechar = () => !ocupado && setDialogo(null);

    const fonteSelecionada = opcoes.fontes.find((f) => f.id === Number(form.fonteDestinoId));
    const podeParcelar = modo === 'criar' && form.tipo === 'saida' && fonteSelecionada?.tipo === 'cartao_credito';

    const enviar = async (e) => {
        e.preventDefault();
        setOcupado(true);
        setErro(SEM_ERRO);
        try {
            if (modo === 'excluir') {
                await api.delete(`/lancamentos/${item.id}`, {
                    params: todasParcelas ? { todasParcelas: true } : undefined,
                });
            } else if (modo === 'criar') {
                await api.post('/lancamentos', {
                    ...form,
                    valor: Number(form.valor),
                    parcelas: podeParcelar ? Number(form.parcelas || 1) : 1,
                });
            } else {
                await api.put(`/lancamentos/${item.id}`, {
                    tipo: form.tipo,
                    descricao: form.descricao,
                    valor: Number(form.valor),
                    data: form.data,
                    categoriaId: form.categoriaId,
                    fonteDestinoId: form.fonteDestinoId,
                });
            }
            setDialogo(null);
            if (modo === 'excluir' && dados.lancamentos.length === 1 && pagina > 1) setPagina(pagina - 1);
            else await carregar();
        } catch (err) {
            const { mensagem, campos } = extrairErroApi(err);
            setErro({ msg: mensagem, campos });
        } finally {
            setOcupado(false);
        }
    };

    const alterarCampo = (nome, valor) => {
        setForm((f) => ({
            ...f,
            [nome]: valor,
            ...(nome === 'tipo' ? { categoriaId: '', parcelas: 1 } : {}),
            ...(nome === 'fonteDestinoId' ? { parcelas: 1 } : {}),
        }));
    };

    const campo = (nome, label, extra = {}) => (
        <TextField
            fullWidth size="small" label={label} value={form[nome] ?? ''} disabled={ocupado || modo === 'ver'}
            onChange={(e) => alterarCampo(nome, e.target.value)}
            error={Boolean(erro.campos[nome])} helperText={erro.campos[nome]} {...extra}
        />
    );

    const categoriasFiltradas = opcoes.categorias.filter((c) => !form.tipo || c.tipo === form.tipo);
    const itens = (lista) => lista.map((o) => <MenuItem key={o.id} value={o.id}>{o.nome}</MenuItem>);

    const titulos = {
        criar: 'Novo lançamento',
        ver: 'Detalhes do lançamento',
        editar: 'Editar lançamento',
        excluir: 'Excluir lançamento',
    };

    const totalItens = dados?.paginacao?.totalItens ?? 0;
    const totalPaginas = dados?.paginacao?.totalPaginas ?? 1;

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
                <Typography variant="h4" component="h1">Lançamentos</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => abrir('criar')}>
                    Novo lançamento
                </Button>
            </Box>

            <FiltrosLancamentos
                filtros={filtros}
                erros={errosDosFiltros}
                categorias={opcoes.categorias}
                fontes={opcoes.fontes}
                onChange={alterarFiltros}
                onLimpar={() => alterarFiltros(filtrosDoMes())}
            />

            {!periodoValido && (
                <Alert severity="info" sx={{ mb: 2 }}>Ajuste o período para ver os lançamentos.</Alert>
            )}

            {periodoValido && erroPagina && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    action={!dados ? (
                        <Button color="inherit" size="small" onClick={carregar} disabled={carregando}>
                            Tentar novamente
                        </Button>
                    ) : undefined}
                >
                    {erroPagina}
                </Alert>
            )}

            {periodoValido && carregando && !dados && (
                <Box sx={{ textAlign: 'center', py: 6 }}><CircularProgress aria-label="Carregando lançamentos" /></Box>
            )}

            {periodoValido && dados && (
                <Stack spacing={2}>
                    <Typography sx={{ color: 'text.secondary' }}>
                        {totalItens === 1 ? '1 lançamento' : `${totalItens} lançamentos`} de{' '}
                        {formatarData(dados.periodo.inicio)} a {formatarData(dados.periodo.fim)}
                    </Typography>
                    <TotaisLancamentos totais={dados.totais} />
                    <Box sx={{ height: 4 }}>{carregando && <LinearProgress />}</Box>
                    {dados.lancamentos.length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                            <Typography sx={{ fontWeight: 600 }}>Nenhum lançamento encontrado.</Typography>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                                Mude o período ou os filtros, ou clique em Novo lançamento.
                            </Typography>
                        </Paper>
                    ) : (
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small" sx={{ minWidth: 720 }}>
                                <TableHead>
                                    <TableRow>
                                        {['Data', 'Descrição', 'Categoria', 'Fonte/destino', 'Valor', 'Ações'].map((t) => (
                                            <TableCell key={t} align={t === 'Valor' ? 'right' : 'left'}>{t}</TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {dados.lancamentos.map((l) => {
                                        const parcela = rotuloDaParcela(l);
                                        return (
                                            <TableRow key={l.id} hover>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatarData(l.data)}</TableCell>
                                                <TableCell>
                                                    {l.descricao}
                                                    {parcela && (
                                                        <Chip label={`Parcela ${parcela}`} size="small" variant="outlined" sx={{ ml: 1 }} />
                                                    )}
                                                </TableCell>
                                                <TableCell>{l.categoriaNome}</TableCell>
                                                <TableCell>{l.fonteDestinoNome}</TableCell>
                                                <TableCell
                                                    align="right"
                                                    sx={{ whiteSpace: 'nowrap', fontWeight: 600, color: l.tipo === 'entrada' ? 'success.main' : 'error.main' }}
                                                >
                                                    {l.tipo === 'entrada' ? '+' : '−'} {formatarMoeda(l.valor)}
                                                </TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                                    <IconButton aria-label="Ver" onClick={() => abrir('ver', l)}><Visibility /></IconButton>
                                                    <IconButton aria-label="Editar" onClick={() => abrir('editar', l)}><Edit /></IconButton>
                                                    <IconButton aria-label="Excluir" color="error" onClick={() => abrir('excluir', l)}><Delete /></IconButton>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    {totalPaginas > 1 && (
                        <Pagination
                            sx={{ alignSelf: 'center' }}
                            count={totalPaginas}
                            page={pagina}
                            onChange={(_, p) => setPagina(p)}
                            disabled={carregando}
                        />
                    )}
                </Stack>
            )}

            <Dialog open={Boolean(dialogo)} onClose={fechar} fullWidth maxWidth="sm">
                <form onSubmit={enviar} noValidate>
                    <DialogTitle>{titulos[modo]}</DialogTitle>
                    <DialogContent>
                        {erro.msg && <Alert severity="error" sx={{ mb: 2 }}>{erro.msg}</Alert>}
                        {modo === 'excluir' ? (
                            <Stack spacing={1}>
                                <DialogContentText>
                                    Excluir o lançamento de {formatarMoeda(item.valor)} em {formatarData(item.data)}?
                                </DialogContentText>
                                {item.totalParcelas > 1 && (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                checked={todasParcelas}
                                                onChange={(e) => setTodasParcelas(e.target.checked)}
                                                disabled={ocupado}
                                            />
                                        }
                                        label={`Excluir todas as ${item.totalParcelas} parcelas deste parcelamento`}
                                    />
                                )}
                            </Stack>
                        ) : (
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                {campo('tipo', 'Tipo', {
                                    select: true,
                                    disabled: ocupado || modo === 'ver' || item?.totalParcelas > 1,
                                    children: [['entrada', 'Entrada'], ['saida', 'Saída']].map(([v, r]) => (
                                        <MenuItem key={v} value={v}>{r}</MenuItem>
                                    )),
                                })}
                                {campo('descricao', 'Descrição', { autoFocus: modo === 'criar' })}
                                {campo('valor', 'Valor total (R$)', { type: 'number', inputProps: { min: 0.01, step: '0.01' } })}
                                {campo('data', 'Data', { type: 'date', slotProps: { inputLabel: { shrink: true } } })}
                                {campo('categoriaId', 'Categoria', { select: true, children: itens(categoriasFiltradas) })}
                                {campo('fonteDestinoId', 'Fonte/destino', { select: true, children: itens(opcoes.fontes) })}
                                {podeParcelar && campo('parcelas', 'Número de parcelas', {
                                    type: 'number',
                                    inputProps: { min: 1, max: 48 },
                                })}
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={fechar} disabled={ocupado}>{modo === 'ver' ? 'Fechar' : 'Cancelar'}</Button>
                        {modo !== 'ver' && (
                            <Button type="submit" variant="contained" disabled={ocupado} color={modo === 'excluir' ? 'error' : 'primary'}>
                                {modo === 'excluir' ? 'Excluir' : 'Salvar'}
                            </Button>
                        )}
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
}