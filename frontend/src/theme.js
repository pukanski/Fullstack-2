import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: { main: '#1B5E20' },
        secondary: { main: '#455A64' },
        background: { default: '#F5F7F6' },
    },
    shape: { borderRadius: 8 },
    typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        button: { textTransform: 'none', fontWeight: 600 },
    },
});

export default theme;