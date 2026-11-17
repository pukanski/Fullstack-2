import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';

export default function RotaProtegida() {
    const { autenticado } = useAuth();
    const location = useLocation();

    if (!autenticado) {
        return <Navigate to="/login" replace state={{ de: `${location.pathname}${location.search}` }} />;
    }

    return <Outlet />;
}