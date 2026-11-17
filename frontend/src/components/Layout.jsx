import LogoutIcon from '@mui/icons-material/Logout';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';

export default function Layout() {
    const { usuario, logout } = useAuth();

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
            </AppBar>
            <Box component="main">
                <Outlet />
            </Box>
        </Box>
    );
}