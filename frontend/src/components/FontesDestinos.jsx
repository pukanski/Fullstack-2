import { useCallback, useEffect, useState } from 'react';
import {
    Alert, Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, IconButton, MenuItem, Paper, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';

const API = `${import.meta.env?.VITE_API_URL ?? 'http://localhost:8000'}/fontes-destinos`;
const CARTAO = 'cartao_credito';
// Ajuste os valores conforme o enum do back-end.
const TIPOS = [
    { valor: 'conta_corrente', rotulo: 'Conta corrente' },
    { valor: 'poupanca', rotulo: 'Poupança' },
    { valor: 'dinheiro', rotulo: 'Dinheiro' },
    { valor: CARTAO, rotulo: 'Cartão de crédito' },
    { valor: 'outro', rotulo: 'Outro' },
];
const CAMPOS_CARTAO = [
    ['dia_fechamento', 'Dia de fechamento', { min: 1, max: 31 }],
    ['dia_vencimento', 'Dia de vencimento', { min: 1, max: 31 }],
    ['limite', 'Limite (R$)', { min: 0, step: '0.01' }],
];
const VAZIO = { nome: '', tipo: '', dia_fechamento: '', dia_vencimento: '', limite: '' };
const moeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const diaValido = (v) => v !== '' && Number.isInteger(Number(v)) && v >= 1 && v <= 31;

async function request(url, options = {}) {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.detail ?? body.message ?? body.mensagem;
        throw new Error(typeof msg === 'string' ? msg : `Erro inesperado (${res.status}).`);
    }
    return res.status === 204 ? null : res.json();
}

function validar(f) {
    const e = {};
    if (!f.nome.trim()) e.nome = 'Informe o nome.';
    if (!f.tipo) e.tipo = 'Selecione o tipo.';
    if (f.tipo === CARTAO) {
        if (!diaValido(f.dia_fechamento)) e.dia_fechamento = 'Informe um dia entre 1 e 31.';
        if (!diaValido(f.dia_vencimento)) e.dia_vencimento = 'Informe um dia entre 1 e 31.';
        if (f.limite === '' || f.limite < 0) e.limite = 'Informe um limite válido.';
    }
    return e;
}

export default function FontesDestinos() {
    const [itens, setItens] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroPagina, setErroPagina] = useState('');
    const [modo, setModo] = useState(null); // 'form' | 'excluir'
    const [alvo, setAlvo] = useState(null);
    const [form, setForm] = useState(VAZIO);
    const [erros, setErros] = useState({});
    const [erro, setErro] = useState('');
    const [ocupado, setOcupado] = useState(false);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErroPagina('');
        try { setItens(await request(API)); }
        catch (e) { setErroPagina(e.message); }
        finally { setCarregando(false); }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const abrir = (novoModo, item = null) => {
        setModo(novoModo); setAlvo(item); setErros({}); setErro('');
        setForm(item ? {
            nome: item.nome, tipo: item.tipo, dia_fechamento: item.dia_fechamento ?? '',
            dia_vencimento: item.dia_vencimento ?? '', limite: item.limite ?? '',
        } : VAZIO);
    };
    const fechar = () => !ocupado && setModo(null);
    const mudar = (campo) => (e) => {
        setForm((f) => ({ ...f, [campo]: e.target.value }));
        setErros((x) => ({ ...x, [campo]: undefined }));
    };

    const executar = async (acao) => {
        setOcupado(true);
        setErro('');
        try { await acao(); setModo(null); await carregar(); }
        catch (e) { setErro(e.message); }
        finally { setOcupado(false); }
    };

    const enviar = (e) => {
        e.preventDefault();
        if (modo === 'excluir') return executar(() => request(`${API}/${alvo.id}`, { method: 'DELETE' }));
        const invalidos = validar(form);
        setErros(invalidos);
        if (Object.keys(invalidos).length) return undefined;
        const cartao = form.tipo === CARTAO;
        const num = (v) => (cartao ? Number(v) : null); 
        return executar(() => request(alvo ? `${API}/${alvo.id}` : API, {
            method: alvo ? 'PUT' : 'POST',
            body: JSON.stringify({
                nome: form.nome.trim(), tipo: form.tipo, dia_fechamento: num(form.dia_fechamento),
                dia_vencimento: num(form.dia_vencimento), limite: num(form.limite),
            }),
        }));
    };

    const campo = (nome, label, extra = {}) => (
        <TextField
            fullWidth label={label} value={form[nome]} onChange={mudar(nome)} disabled={ocupado}
            error={Boolean(erros[nome])} helperText={erros[nome]} {...extra}
        />
    );

    return (
        <Container sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Fontes e destinos</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => abrir('form')}>Novo</Button>
            </Box>

            {erroPagina && <Alert severity="error" sx={{ mb: 2 }}>{erroPagina}</Alert>}

            {carregando ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Nome</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell align="right">Fechamento</TableCell>
                                <TableCell align="right">Vencimento</TableCell>
                                <TableCell align="right">Limite</TableCell>
                                <TableCell align="right" sx={{ width: 120 }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {itens.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">Nenhum registro cadastrado.</TableCell>
                                </TableRow>
                            )}
                            {itens.map((i) => {
                                const c = i.tipo === CARTAO;
                                return (
                                    <TableRow key={i.id} hover>
                                        <TableCell>{i.nome}</TableCell>
                                        <TableCell>{TIPOS.find((t) => t.valor === i.tipo)?.rotulo ?? i.tipo}</TableCell>
                                        <TableCell align="right">{c ? `Dia ${i.dia_fechamento}` : '—'}</TableCell>
                                        <TableCell align="right">{c ? `Dia ${i.dia_vencimento}` : '—'}</TableCell>
                                        <TableCell align="right">{c ? moeda(i.limite) : '—'}</TableCell>
                                        <TableCell align="right">
                                            <IconButton aria-label={`Editar ${i.nome}`} onClick={() => abrir('form', i)}><Edit /></IconButton>
                                            <IconButton aria-label={`Excluir ${i.nome}`} color="error" onClick={() => abrir('excluir', i)}><Delete /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={Boolean(modo)} onClose={fechar} fullWidth maxWidth="sm">
                <form onSubmit={enviar} noValidate>
                    <DialogTitle>
                        {modo === 'excluir' ? 'Excluir' : alvo ? 'Editar' : 'Novo'} fonte/destino
                    </DialogTitle>
                    <DialogContent>
                        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
                        {modo === 'excluir' ? (
                            <DialogContentText>
                                Deseja realmente excluir <strong>{alvo?.nome}</strong>?
                            </DialogContentText>
                        ) : (
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                {campo('nome', 'Nome', { autoFocus: true })}
                                {campo('tipo', 'Tipo', { select: true, children: TIPOS.map((t) => (
                                    <MenuItem key={t.valor} value={t.valor}>{t.rotulo}</MenuItem>
                                )) })}
                                {form.tipo === CARTAO && CAMPOS_CARTAO.map(([nome, label, attrs]) => (
                                    <Box key={nome}>{campo(nome, label, { type: 'number', inputProps: attrs })}</Box>
                                ))}
                            </Stack>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={fechar} disabled={ocupado}>Cancelar</Button>
                        <Button
                            type="submit" variant="contained" disabled={ocupado}
                            color={modo === 'excluir' ? 'error' : 'primary'}
                        >
                            {modo === 'excluir' ? 'Excluir' : 'Salvar'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Container>
    );
}