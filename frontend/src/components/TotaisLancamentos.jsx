import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { formatarMoeda } from '../utils/formatacao.js';

function corDoSaldo(valor) {
    if (valor > 0) return 'success.main';
    if (valor < 0) return 'error.main';
    return 'text.primary';
}

export default function TotaisLancamentos({ totais }) {
    const cartoes = [
        { titulo: 'Entradas', valor: totais.entradas, cor: 'success.main' },
        { titulo: 'Saídas', valor: totais.saidas, cor: 'error.main' },
        { titulo: 'Saldo', valor: totais.saldo, cor: corDoSaldo(totais.saldo) },
    ];

    return (
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' } }}>
            {cartoes.map(({ titulo, valor, cor }) => (
                <Paper key={titulo} variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {titulo}
                    </Typography>
                    <Typography variant="h5" component="p" sx={{ fontWeight: 700, color: cor }}>
                        {formatarMoeda(valor)}
                    </Typography>
                </Paper>
            ))}
        </Box>
    );
}