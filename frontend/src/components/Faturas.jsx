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
import api, { extrairErroApi } from '../services/api.js';
import { formatarData, formatarMoeda } from '../utils/formatacao.js';
import { lerFaturas, nomeDaReferencia, rotuloDaCompra } from '../utils/faturas.js';

const primeiraMaiuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

function Fatura({ fatura, atual }) {
    const fechada = fatura.situacao === 'fechada';

    return (
        <Paper
            variant="outlined"
            sx={{ p: 2, height: '100%', borderColor: atual ? 'primary.main' : 'divider', borderWidth: atual ? 2 : 1 }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>
                    {primeiraMaiuscula(nomeDaReferencia(fatura.referencia))}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                    {atual && <Chip label="Atual" color="primary" size="small" />}
                    <Chip label={fechada ? 'Fechada' : 'Aberta'} color={fechada ? 'warning' : 'default'} variant="outlined" size="small" />
                </Stack>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                Fecha em {formatarData(fatura.fechamento)} e vence em {formatarData(fatura.vencimento)}
            </Typography>
            <Typography variant="h5" component="p" sx={{ fontWeight: 700, mt: 1.5 }}>
                {formatarMoeda(fatura.total)}
            </Typography>

            <Divider sx={{ my: 1.5 }} />

            {fatura.compras.length === 0 ? (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>Nenhuma compra nesta fatura.</Typography>
            ) : (
                <Stack component="ul" spacing={0.75} sx={{ listStyle: 'none', p: 0, m: 0 }}>
                    {fatura.compras.map((compra) => (
                        <Box
                            component="li"
                            key={compra.lancamentoId}
                            sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}
                        >
                            <Typography variant="body2">{rotuloDaCompra(compra)}</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{formatarMoeda(compra.valor)}</Typography>
                        </Box>
                    ))}
                </Stack>
            )}
        </Paper>
    );
}

function CartaoDeCredito({ cartao }) {
    return (
        <Paper variant="outlined" sx={{ p: 2 }}>
            <Box
                sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 1,
                    mb: 2,
                }}
            >
                <Box>
                    <Typography variant="h6" component="h2">{cartao.nome}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Fecha todo dia {cartao.diaFechamento} e vence todo dia {cartao.diaVencimento}
                    </Typography>
                </Box>
                <Typography sx={{ fontWeight: 600 }}>Limite: {formatarMoeda(cartao.limite)}</Typography>
            </Box>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' } }}>
                {cartao.faturas.map((fatura, indice) => (
                    <Fatura key={fatura.referencia} fatura={fatura} atual={indice === 0} />
                ))}
            </Box>
        </Paper>
    );
}

export default function Faturas() {
    const [tentativa, setTentativa] = useState(0);
    const [resposta, setResposta] = useState({ tentativa: -1, dados: null, erro: '' });

    const carregando = resposta.tentativa !== tentativa;
    const dados = carregando ? null : resposta.dados;

    useEffect(() => {
        let ativo = true;
        api.get('/relatorios/faturas', { params: { meses: 4 } }).then(
            ({ data }) => {
                if (ativo) {
                    setResposta({ tentativa, dados: lerFaturas(data), erro: '' });
                }
            },
            (erro) => {
                if (ativo) {
                    const { mensagem } = extrairErroApi(erro, 'Não foi possível carregar as faturas.');
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
                    <CircularProgress aria-label="Carregando as faturas" />
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

        if (dados.cartoes.length === 0) {
            return (
                <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                    <Typography sx={{ fontWeight: 600 }}>Você ainda não tem cartão de crédito cadastrado.</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 2 }}>
                        Cadastre um cartão com o dia de fechamento, o dia de vencimento e o limite para ver as faturas.
                    </Typography>
                    <Button variant="contained" component={RouterLink} to="/fontes-destinos">
                        Ir para Fontes e destinos
                    </Button>
                </Paper>
            );
        }

        return dados.cartoes.map((cartao) => <CartaoDeCredito key={cartao.id} cartao={cartao} />);
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Stack spacing={3}>
                <Box>
                    <Typography variant="h4" component="h1">Faturas</Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                        A fatura atual e as 3 próximas de cada cartão, com as compras e as parcelas de cada uma.
                    </Typography>
                </Box>
                {renderizarConteudo()}
            </Stack>
        </Container>
    );
}