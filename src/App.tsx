import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Layout from './components/Layout';
import InventarioPage from './pages/InventarioPage';
import LoginPage from './pages/LoginPage';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Preguntamos a Supabase si ya hay alguien logueado al abrir la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Nos quedamos escuchando si alguien inicia sesión o se sale
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pantalla de carga super rápida mientras verificamos la llave
  if (loading) {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-blue-400 font-bold">Iniciando sistema...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta Pública */}
        <Route 
          path="/login" 
          element={!session ? <LoginPage /> : <Navigate to="/" />} 
        />
        
        {/* Rutas Privadas (Protegidas por la sesión) */}
        <Route 
          path="/" 
          element={session ? <Layout /> : <Navigate to="/login" />}
        >
          <Route index element={<InventarioPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;