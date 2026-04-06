import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';
import { TrendingUp, Users, AlertTriangle, DollarSign, Package, BarChart3 } from 'lucide-react';

export default function DashboardPage() {
  const [ventasHoy, setVentasHoy] = useState(0);
  const [totalDeudas, setTotalDeudas] = useState(0);
  const [alertasStock, setAlertasStock] = useState(0);
  const [productosTotales, setProductosTotales] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      setLoading(true);
      try {
        // 1. Calcular Ventas del Día
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        const { data: ventas } = await supabase
          .from('ventas')
          .select('total')
          .gte('created_at', hoy.toISOString());
          
        const sumaVentas = ventas?.reduce((acc, curr) => acc + Number(curr.total), 0) || 0;
        setVentasHoy(sumaVentas);

        // 2. Calcular Total de Deudas (Cuentas por Cobrar)
        const { data: clientes } = await supabase
          .from('clientes')
          .select('saldo_actual')
          .gt('saldo_actual', 0);
          
        const sumaDeudas = clientes?.reduce((acc, curr) => acc + Number(curr.saldo_actual), 0) || 0;
        setTotalDeudas(sumaDeudas);

        // 3. Contar Alertas de Stock y Total de Productos
        const { data: productos } = await supabase
          .from('productos')
          .select('stock_actual, stock_minimo');
          
        if (productos) {
          setProductosTotales(productos.length);
          const enRiesgo = productos.filter(p => p.stock_actual <= p.stock_minimo).length;
          setAlertasStock(enRiesgo);
        }

      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarEstadisticas();
  }, []);

  if (loading) {
    return <div className="p-8 text-slate-500 font-bold animate-pulse">Calculando métricas del negocio...</div>;
  }

  return (
    <div className="p-8 bg-slate-50/50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <BarChart3 className="text-blue-600" size={32} />
          Panel de Administración
        </h1>
        <p className="text-gray-500 mt-2 font-medium">Resumen en tiempo real de Tracto-disel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Tarjeta 1: Ventas Hoy */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
          <div className="bg-green-100 p-4 rounded-xl">
            <TrendingUp className="text-green-600" size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Ingresos de Hoy</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(ventasHoy)}</p>
          </div>
        </div>

        {/* Tarjeta 2: Cuentas por Cobrar */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
          <div className="bg-blue-100 p-4 rounded-xl">
            <DollarSign className="text-blue-600" size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Cuentas por Cobrar</p>
            <p className="text-2xl font-black text-blue-700 mt-1">{formatCurrency(totalDeudas)}</p>
          </div>
        </div>

        {/* Tarjeta 3: Alertas de Stock */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
          <div className="bg-amber-100 p-4 rounded-xl">
            <AlertTriangle className="text-amber-600" size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Piezas en Riesgo</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{alertasStock} <span className="text-sm font-medium text-gray-400">alertas</span></p>
          </div>
        </div>

        {/* Tarjeta 4: Total de Catálogo */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition">
          <div className="bg-indigo-100 p-4 rounded-xl">
            <Package className="text-indigo-600" size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Catálogo Activo</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{productosTotales} <span className="text-sm font-medium text-gray-400">refacciones</span></p>
          </div>
        </div>
      </div>

      {/* Sección inferior (Puedes expandirla en el futuro con gráficas) */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <Users className="text-gray-400" size={24} />
          <h2 className="text-xl font-bold text-slate-800">Estado del Sistema</h2>
        </div>
        <p className="text-gray-600 leading-relaxed">
          Todos los módulos operativos (Inventario, Punto de Venta, Créditos y Devoluciones) se encuentran funcionando y sincronizados con la base de datos central en la nube. 
        </p>
      </div>
    </div>
  );
}