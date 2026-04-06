import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';

// Importación de componentes y páginas
import Layout from './components/Layout';
import InventarioPage from './pages/InventarioPage';
import LoginPage from './pages/LoginPage';
import PuntoVentaPage from './pages/PuntoVentaPage';
import ClientesPage from './pages/ClientesPage';
import AlertasPage from './pages/AlertasPage';
import DevolucionesPage from './pages/DevolucionesPage';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-blue-400 font-bold tracking-widest animate-pulse text-sm uppercase">Cargando Tracto-disel...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <LoginPage /> : <Navigate to="/" />} 
        />
        
        <Route 
          path="/" 
          element={session ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<InventarioPage />} />
          <Route path="punto-venta" element={<PuntoVentaPage />} />
          <Route path="clientes" element={<ClientesPage />} />
          <Route path="alertas" element={<AlertasPage />} />
          <Route path="devoluciones" element={<DevolucionesPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;