import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Producto } from '../types/database.types';

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Catálogo de Productos</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          + Nuevo Producto
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500">Aquí irá la tabla de productos...</p>
      </div>
    </div>
  );
}