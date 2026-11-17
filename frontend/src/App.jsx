import { Navigate, Route, Routes } from 'react-router-dom';
import Cadastro from './components/Cadastro.jsx';
import Categorias from './components/Categorias.jsx';
import Dashboard from './components/Dashboard.jsx';
import Faturas from './components/Faturas.jsx';
import FontesDestinos from './components/FontesDestinos.jsx';
import Lancamentos from './components/Lancamentos.jsx';
import Layout from './components/Layout.jsx';
import Login from './components/Login.jsx';
import Relatorios from './components/Relatorios.jsx';
import RotaProtegida from './components/RotaProtegida.jsx';
import RotaPublica from './components/RotaPublica.jsx';
import SaudeFinanceira from './components/SaudeFinanceira.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route element={<RotaPublica />}>
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<Cadastro />} />
      </Route>

      <Route element={<RotaProtegida />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lancamentos" element={<Lancamentos />} />
          <Route path="/categorias" element={<Categorias />} />
          <Route path="/fontes-destinos" element={<FontesDestinos />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/faturas" element={<Faturas />} />
          <Route path="/saude-financeira" element={<SaudeFinanceira />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;