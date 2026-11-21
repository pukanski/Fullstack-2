import { useCallback, useEffect, useState } from 'react';
import {
    Alert, Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, IconButton, MenuItem, Pagination, Paper, Stack, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { Delete, Edit, Visibility } from '@mui/icons-material';

const BASE = import.meta.env?.VITE_API_URL ?? 'http://localhost:8000';
const moeda = (v) => Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dia = (d) => String(d).slice(0, 10); 
const dataBr = (d) => dia(d).split('-').reverse().join('/');
const SEM_ERRO = { msg: '', campos: {} };
async function request(caminho, options = {}) {
    const res = await fetch(`${BASE}${caminho}`, { headers: { 'Content-Type': 'application/json' }, ...options });
    if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        const msg = [b.mensagem, b.message, b.erro, b.detail].find((m) => typeof m === 'string');
        throw Object.assign(new Error(msg ?? `Erro inesperado (${res.status}).`), { campos: b.campos ?? {} });
    }
    return res.status === 204 ? null : res.json();
}

export default function Lancamentos() {
    const [dados, setDados] = useState(null);
    const [opcoes, setOpcoes] = useState({ categorias: [], fontes: [] });
    const [pagina, setPagina] = useState(1);
    const [carregando, setCarregando] = useState(true);
    const [erroPagina, setErroPagina] = useState('');
    const [dialogo, setDialogo] = useState(null); // { modo: 'ver' | 'editar' | 'excluir', item }
    const [form, setForm] = useState({});
    const [erro, setErro] = useState(SEM_ERRO);
    const [ocupado, setOcupado] = useState(false);
    const { modo, item } = dialogo ?? {};
    const carregar = useCallback(async () => {
        setCarregando(true);
        setErroPagina('');
        try { setDados(await request(`/lancamentos?pagina=${pagina}`)); }
        catch (e) { setErroPagina(e.message); }
        finally { setCarregando(false); }
    }, [pagina]);
    useEffect(() => { carregar(); }, [carregar]);
    useEffect(() => {
        Promise.all([request('/categorias'), request('/fontes-destinos')])
            .then(([categorias, fontes]) => setOpcoes({ categorias, fontes }))
            .catch((e) => setErroPagina(e.message));
    }, []);
    const abrir = (novoModo, l) => {
        setDialogo({ modo: novoModo, item: l });
        setErro(SEM_ERRO);
        setForm({ tipo: l.tipo, descricao: l.descricao ?? '', valor: Number(l.valor), data: dia(l.data),
            categoriaId: l.categoriaId, fonteDestinoId: l.fonteDestinoId });
    };
    const fechar = () => !ocupado && setDialogo(null);
    const enviar = async (e) => {
        e.preventDefault();
        setOcupado(true);
        setErro(SEM_ERRO);
        try {
            await request(`/lancamentos/${item.id}`, modo === 'excluir'
                ? { method: 'DELETE' }
                : { method: 'PUT', body: JSON.stringify({ ...form, valor: Number(form.valor) }) });
            setDialogo(null);
            // Excluiu o único item de uma página > 1: volta uma página.
            if (modo === 'excluir' && dados.lancamentos.length === 1 && pagina > 1) setPagina(pagina - 1);
            else await carregar();
        } catch (err) {
            setErro({ msg: err.message, campos: err.campos });
        } finally { setOcupado(false); }
    };
    const campo = (nome, label, extra = {}) => (
        <TextField
            fullWidth size="small" label={label} value={form[nome] ?? ''} disabled={ocupado || modo === 'ver'}
            onChange={(e) => setForm((f) => ({ ...f, [nome]: e.target.value }))}
            error={Boolean(erro.campos[nome])} helperText={erro.campos[nome]} {...extra}
        />
    );
    const itens = (lista) => lista.map((o) => <MenuItem key={o.id} value={o.id}>{o.nome}</MenuItem>);
    return (
        <Container sx={{ py: 4 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 3 }}>Lançamentos</Typography>
            {erroPagina && <Alert severity="error" sx={{ mb: 2 }}>{erroPagina}</Alert>}
            {carregando && <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>}
            {dados && !carregando && (
                <>
                    <Typography color="text.secondary" sx={{ mb: 1 }}>Período: {dataBr(dados.periodo.inicio)} a {dataBr(dados.periodo.fim)}</Typography>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {['Data', 'Descrição', 'Categoria', 'Fonte/destino', 'Valor', 'Ações'].map((t) => <TableCell key={t}>{t}</TableCell>)}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {dados.lancamentos.map((l) => (
                                    <TableRow key={l.id} hover>
                                        <TableCell>{dataBr(l.data)}</TableCell>
                                        <TableCell>{l.descricao}{l.totalParcelas > 1 && ` (${l.parcelaAtual}/${l.totalParcelas})`}</TableCell>
                                        <TableCell>{l.categoriaNome}</TableCell>
                                        <TableCell>{l.fonteDestinoNome}</TableCell>
                                        <TableCell sx={{ color: l.tipo === 'entrada' ? 'success.main' : 'error.main' }}>
                                            {l.tipo === 'entrada' ? '+' : '−'} {moeda(l.valor)}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton aria-label="Ver" onClick={() => abrir('ver', l)}><Visibility /></IconButton>
                                            <IconButton aria-label="Editar" onClick={() => abrir('editar', l)}><Edit /></IconButton>
                                            <IconButton aria-label="Excluir" color="error" onClick={() => abrir('excluir', l)}><Delete /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <Pagination sx={{ mt: 2 }} count={dados.paginacao.totalPaginas} page={pagina} onChange={(_, p) => setPagina(p)} />
                </>
            )}
            <Dialog open={Boolean(dialogo)} onClose={fechar} fullWidth maxWidth="sm">
                <form onSubmit={enviar} noValidate>
                    <DialogTitle>{{ ver: 'Detalhes do lançamento', editar: 'Editar lançamento', excluir: 'Excluir lançamento' }[modo]}</DialogTitle>
                    <DialogContent>
                        {erro.msg && <Alert severity="error" sx={{ mb: 2 }}>{erro.msg}</Alert>}
                        {modo === 'excluir' ? (
                            <DialogContentText>
                                Excluir o lançamento de {moeda(item.valor)} em {dataBr(item.data)}?
                                {item.totalParcelas > 1 && ' Apenas esta parcela será excluída.'}
                            </DialogContentText>
                        ) : (
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                {campo('tipo', 'Tipo', { select: true, disabled: ocupado || modo === 'ver' || item?.totalParcelas > 1,
                                    children: [['entrada', 'Entrada'], ['saida', 'Saída']].map(([v, r]) => <MenuItem key={v} value={v}>{r}</MenuItem>) })}
                                {campo('descricao', 'Descrição')}
                                {campo('valor', 'Valor (R$)', { type: 'number', inputProps: { min: 0.01, step: '0.01' } })}
                                {campo('data', 'Data', { type: 'date', slotProps: { inputLabel: { shrink: true } } })}
                                {campo('categoriaId', 'Categoria', { select: true, children: itens(opcoes.categorias) })}
                                {campo('fonteDestinoId', 'Fonte/destino', { select: true, children: itens(opcoes.fontes) })}
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={fechar} disabled={ocupado}>{modo === 'ver' ? 'Fechar' : 'Cancelar'}</Button>
                        {modo !== 'ver' && <Button type="submit" variant="contained" disabled={ocupado} color={modo === 'excluir' ? 'error' : 'primary'}>{modo === 'excluir' ? 'Excluir' : 'Salvar'}</Button>}
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
}