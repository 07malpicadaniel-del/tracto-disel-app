import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Producto } from '../types/database.types';
import { Bell, AlertTriangle, PackageOpen, ArrowRight } from 'lucide-react';

export default function AlertasPage() {
  const [alertas, setAlertas] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlertas = async () => {
    setLoading(true);
    try {
      // Traemos los productos y filtramos los que tienen stock bajo
      const { data, error } = await supabase.from('productos').select('*');
      
      if (error) throw error;

      if (data) {
        const productosEnRiesgo = data.filter(p => p.stock_actual <= p.stock_minimo);
        // Ordenamos para que los que tienen 0 stock aparezcan primero
        productosEnRiesgo.sort((a, b) => a.stock_actual - b.stock_actual);
        setAlertas(productosEnRiesgo);
      }
    } catch (error) {
      console.error('Error al cargar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Bell className="text-amber-500" />
          Alertas de Inventario
        </h1>
        <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm">
          <AlertTriangle size={20} />
          {alertas.length} {alertas.length === 1 ? 'Pieza por agotarse' : 'Piezas por agotarse'}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-medium">Buscando alertas...</div>
        ) : alertas.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="bg-green-100 p-4 rounded-full mb-4">
              <PackageOpen className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">¡Todo bajo control!</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Tu inventario está sano. Ningún producto ha caído por debajo de su límite de stock mínimo establecido.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {alertas.map((producto) => (
              <div 
                key={producto.id} 
                className={`relative overflow-hidden rounded-xl border-2 p-5 shadow-sm transition-all hover:shadow-md ${
                  producto.stock_actual === 0 
                    ? 'bg-red-50 border-red-200' 
                    : 'bg-amber-50 border-amber-200'
                }`}
              >
                {/* Etiqueta superior */}
                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-lg font-bold text-xs ${
                  producto.stock_actual === 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                }`}>
                  {producto.stock_actual === 0 ? 'AGOTADO' : 'STOCK BAJO'}
                </div>

                <div className="mt-2">
                  <p className="text-sm font-bold text-gray-500">{producto.numero_parte}</p>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight mt-1 mb-3">
                    {producto.nombre}
                  </h3>
                  
                  <div className="flex items-center gap-4 bg-white/60 p-3 rounded-lg border border-white">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase font-bold">Actual</p>
                      <p className={`text-2xl font-black ${producto.stock_actual === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {producto.stock_actual}
                      </p>
                    </div>
                    <ArrowRight className="text-gray-300" />
                    <div className="text-center">
                      <p className="text-xs text-gray-500 uppercase font-bold">Mínimo</p>
                      <p className="text-xl font-bold text-slate-700">
                        {producto.stock_minimo}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}