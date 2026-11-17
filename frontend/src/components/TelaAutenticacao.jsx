import AccountBalanceWalletOutlined from '@mui/icons-material/AccountBalanceWalletOutlined';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function TelaAutenticacao({ titulo, subtitulo, rodape, children }) {
    return (
        <Box
            component="main"
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
                py: 4,
            }}
        >
            <Paper variant="outlined" sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 4 } }}>
                <Stack spacing={1} sx={{ alignItems: 'center', textAlign: 'center', mb: 3 }}>
                    <AccountBalanceWalletOutlined color="primary" sx={{ fontSize: 40 }} />
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 700 }}>
                        {titulo}
                    </Typography>
                    {subtitulo && (
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {subtitulo}
                        </Typography>
                    )}
                </Stack>

                {children}

                {rodape && (
                    <Typography variant="body2" sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
                        {rodape}
                    </Typography>
                )}
            </Paper>
        </Box>
    );
}