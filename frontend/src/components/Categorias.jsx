import { Add, Delete, Edit } from '@mui/icons-material';
import {
    Alert, Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, IconButton, MenuItem, Paper, Stack, Table, TableBody,
    TableCell, TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import api, { extrairErroApi } from '../services/api.js';

const TIPOS = [
    { valor: 'entrada', rotulo: 'Entrada' },
    { valor: 'saida', rotulo: 'Saída' },
];
const VAZIO = { nome: '', tipo: 'saida' };

export default function Categorias() {
    const [categorias, setCategorias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroPagina, setErroPagina] = useState('');
    const [modo, setModo] = useState(null);
    const [alvo, setAlvo] = useState(null);
    const [form, setForm] = useState(VAZIO);
    const [erro, setErro] = useState('');
    const [ocupado, setOcupado] = useState(false);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErroPagina('');
        try {
            const { data } = await api.get('/categorias');
            setCategorias(data);
        } catch (e) {
            setErroPagina(extrairErroApi(e).mensagem);
        } finally {
            setCarregando(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const abrir = (novoModo, item = null) => {
        setModo(novoModo);
        setAlvo(item);
        setForm(item ? { nome: item.nome, tipo: item.tipo } : VAZIO);
        setErro('');
    };
    const fechar = () => !ocupado && setModo(null);

    const executar = async (acao) => {
        setOcupado(true);
        setErro('');
        try {
            await acao();
            setModo(null);
            await carregar();
        } catch (e) {
            setErro(extrairErroApi(e).mensagem);
        } finally {
            setOcupado(false);
        }
    };

    const enviar = (e) => {
        e.preventDefault();
        if (modo === 'excluir') return executar(() => api.delete(`/categorias/${alvo.id}`));
        if (!form.nome.trim()) return setErro('Informe o nome da categoria.');
        const payload = { nome: form.nome.trim(), tipo: form.tipo };
        return executar(() => (alvo ? api.put(`/categorias/${alvo.id}`, payload) : api.post('/categorias', payload)));
    };

    return (
        <Container sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1">Categorias</Typography>
                <Button variant="contained" startIcon={<Add />} onClick={() => abrir('form')}>
                    Nova categoria
                </Button>
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
                                <TableCell align="right" sx={{ width: 120 }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categorias.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">Nenhuma categoria cadastrada.</TableCell>
                                </TableRow>
                            )}
                            {categorias.map((c) => (
                                <TableRow key={c.id} hover>
                                    <TableCell>{c.nome}</TableCell>
                                    <TableCell>{TIPOS.find((t) => t.valor === c.tipo)?.rotulo ?? c.tipo}</TableCell>
                                    <TableCell align="right">
                                        <IconButton aria-label={`Editar ${c.nome}`} onClick={() => abrir('form', c)}>
                                            <Edit />
                                        </IconButton>
                                        <IconButton aria-label={`Excluir ${c.nome}`} color="error" onClick={() => abrir('excluir', c)}>
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={Boolean(modo)} onClose={fechar} fullWidth maxWidth="xs">
                <form onSubmit={enviar} noValidate>
                    <DialogTitle>
                        {modo === 'excluir' ? 'Excluir categoria' : alvo ? 'Editar categoria' : 'Nova categoria'}
                    </DialogTitle>
                    <DialogContent>
                        {erro && <Alert severity="error" sx={{ mb: 2 }}>{erro}</Alert>}
                        {modo === 'excluir' ? (
                            <DialogContentText>
                                Deseja realmente excluir <strong>{alvo?.nome}</strong>?
                            </DialogContentText>
                        ) : (
                            <Stack spacing={2} sx={{ mt: 1 }}>
                                <TextField
                                    autoFocus fullWidth label="Nome" value={form.nome}
                                    disabled={ocupado} error={Boolean(erro)}
                                    onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                                />
                                <TextField
                                    select fullWidth label="Tipo" value={form.tipo} disabled={ocupado}
                                    onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                                >
                                    {TIPOS.map((t) => (
                                        <MenuItem key={t.valor} value={t.valor}>{t.rotulo}</MenuItem>
                                    ))}
                                </TextField>
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