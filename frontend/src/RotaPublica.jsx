import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';

export default function RotaPublica() {
    const { autenticado } = useAuth();
    const location = useLocation();

    if (autenticado) {
        const destino = location.state?.de;
        const valido = typeof destino === 'string' && destino.startsWith('/') && !destino.startsWith('//');
        return <Navigate to={valido ? destino : '/dashboard'} replace />;
    }

    return <Outlet />;
}