import { useCallback, useEffect, useState } from 'react';
import {
    Alert, Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogContent,
    DialogContentText, DialogTitle, IconButton, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, TextField, Typography,
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';

const API = `${import.meta.env?.VITE_API_URL ?? 'http://localhost:8000'}/categorias`;

async function request(url, options = {}) {
    const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = body.detail ?? body.message ?? body.mensagem;
        throw new Error(typeof msg === 'string' ? msg : `Erro inesperado (${res.status}).`);
    }
    return res.status === 204 ? null : res.json();
}

export default function Categorias() {
    const [categorias, setCategorias] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erroPagina, setErroPagina] = useState('');
    const [modo, setModo] = useState(null); 
    const [alvo, setAlvo] = useState(null);
    const [nome, setNome] = useState('');
    const [erro, setErro] = useState('');
    const [ocupado, setOcupado] = useState(false);

    const carregar = useCallback(async () => {
        setCarregando(true);
        setErroPagina('');
        try { setCategorias(await request(API)); }
        catch (e) { setErroPagina(e.message); }
        finally { setCarregando(false); }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const abrir = (novoModo, item = null) => {
        setModo(novoModo); setAlvo(item); setNome(item?.nome ?? ''); setErro('');
    };
    const fechar = () => !ocupado && setModo(null);

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
        if (!nome.trim()) return setErro('Informe o nome da categoria.');
        return executar(() => request(alvo ? `${API}/${alvo.id}` : API, {
            method: alvo ? 'PUT' : 'POST',
            body: JSON.stringify({ nome: nome.trim() }),
        }));
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
                                <TableCell align="right" sx={{ width: 120 }}>Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {categorias.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} align="center">Nenhuma categoria cadastrada.</TableCell>
                                </TableRow>
                            )}
                            {categorias.map((c) => (
                                <TableRow key={c.id} hover>
                                    <TableCell>{c.nome}</TableCell>
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
                            <TextField
                                autoFocus fullWidth margin="dense" label="Nome" value={nome}
                                disabled={ocupado} error={Boolean(erro)}
                                onChange={(e) => setNome(e.target.value)}
                            />
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