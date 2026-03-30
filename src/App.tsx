import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import InventarioPage from './pages/InventarioPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<InventarioPage />} />
          {/* Aquí irán las rutas de Ventas, Dashboard, etc. más adelante */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;