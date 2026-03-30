import { Outlet } from 'react-router-dom';
import { Settings, Package, ShoppingCart, Users } from 'lucide-react';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-slate-900 text-white p-4 hidden md:flex flex-col">
        <h2 className="text-2xl font-bold mb-8 text-blue-400">Tracto-disel</h2>
        <nav className="flex flex-col gap-4">
          <div className="flex items-center gap-3 p-2 bg-slate-800 rounded cursor-pointer">
            <Package size={20} />
            <span>Inventario</span>
          </div>
          {/* Los demás menús los activaremos en las siguientes fases */}
        </nav>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1">
        <Outlet /> {/* Aquí adentro se renderizarán las páginas */}
      </main>
    </div>
  );
}