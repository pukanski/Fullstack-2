import { Navigate, Route, Routes } from 'react-router-dom';
import Cadastro from './components/Cadastro.jsx';
import Categorias from './components/Categorias.jsx';
import Dashboard from './components/Dashboard.jsx';
import Faturas from './components/Faturas.jsx';
import FontesDestinos from './components/FontesDestinos.jsx';
import Lancamentos from './components/Lancamentos.jsx';
import Login from './components/Login.jsx';
import Relatorios from './components/Relatorios.jsx';
import SaudeFinanceira from './components/SaudeFinanceira.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/lancamentos" element={<Lancamentos />} />
      <Route path="/categorias" element={<Categorias />} />
      <Route path="/fontes-destinos" element={<FontesDestinos />} />
      <Route path="/relatorios" element={<Relatorios />} />
      <Route path="/faturas" element={<Faturas />} />
      <Route path="/saude-financeira" element={<SaudeFinanceira />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;