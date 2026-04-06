import { Outlet, NavLink } from 'react-router-dom';
import { Package, ShoppingCart, Users, LogOut, Bell, Undo2, BarChart3 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Layout() {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-slate-900 text-white p-4 hidden md:flex flex-col shadow-xl">
        <div className="mb-10 p-2">
          <h2 className="text-2xl font-bold text-blue-400 tracking-tight">Tracto-disel</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Gestión de Refacciones</p>
        </div>

        <nav className="flex flex-col gap-2 flex-1 overflow-y-auto">
          <NavLink 
            to="/" 
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/punto-venta" 
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <ShoppingCart size={20} />
            <span>Punto de Venta</span>
          </NavLink>

          <NavLink 
            to="/inventario" 
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Package size={20} />
            <span>Inventario</span>
          </NavLink>

          <NavLink 
            to="/clientes" 
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={20} />
            <span>Créditos y Clientes</span>
          </NavLink>

          <NavLink 
            to="/alertas" 
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Bell size={20} />
            <span>Alertas Stock</span>
          </NavLink>

          <NavLink 
            to="/devoluciones" 
            className={({ isActive }) => `flex items-center gap-3 p-3 rounded-xl transition-all duration-200 font-medium ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Undo2 size={20} />
            <span>Devoluciones</span>
          </NavLink>
        </nav>

        {/* Botón de Cerrar Sesión */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 rounded-xl text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors font-medium mt-auto"
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto">
        <Outlet /> 
      </main>
    </div>
  );
}