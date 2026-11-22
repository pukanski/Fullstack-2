import LogoutIcon from '@mui/icons-material/Logout';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Outlet, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';

const PAGINAS = [
    { caminho: '/dashboard', rotulo: 'Dashboard' },
    { caminho: '/lancamentos', rotulo: 'Lançamentos' },
    { caminho: '/categorias', rotulo: 'Categorias' },
    { caminho: '/fontes-destinos', rotulo: 'Fontes e destinos' },
    { caminho: '/relatorios', rotulo: 'Relatórios' },
    { caminho: '/faturas', rotulo: 'Faturas' },
    { caminho: '/saude-financeira', rotulo: 'Saúde financeira' },
];

export default function Layout() {
    const { usuario, logout } = useAuth();
    const { pathname } = useLocation();
    const paginaAtual = PAGINAS.find((pagina) => pathname.startsWith(pagina.caminho))?.caminho ?? false;

    return (
        <Box sx={{ minHeight: '100vh' }}>
            <AppBar position="sticky" elevation={0}>
                <Toolbar sx={{ gap: 2 }}>
                    <Typography
                        variant="h6"
                        component={RouterLink}
                        to="/dashboard"
                        sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}
                    >
                        Controle Financeiro
                    </Typography>
                    {usuario?.nome && (
                        <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' } }}>
                            Olá, {usuario.nome.split(' ')[0]}
                        </Typography>
                    )}
                    <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
                        Sair
                    </Button>
                </Toolbar>
                <Tabs
                    value={paginaAtual}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="inherit"
                    aria-label="Páginas"
                    sx={{ px: 1, '& .MuiTabs-indicator': { backgroundColor: 'common.white' } }}
                >
                    {PAGINAS.map((pagina) => (
                        <Tab
                            key={pagina.caminho}
                            value={pagina.caminho}
                            label={pagina.rotulo}
                            component={RouterLink}
                            to={pagina.caminho}
                        />
                    ))}
                </Tabs>
            </AppBar>
            <Box component="main">
                <Outlet />
            </Box>
        </Box>
    );
}