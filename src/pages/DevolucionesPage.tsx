import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';
import { Undo2, AlertCircle, CheckCircle, RefreshCcw } from 'lucide-react';

export default function DevolucionesPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [historial, setHistorial] = useState<any[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Estados del formulario
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState<number | string>(1);
  const [motivo, setMotivo] = useState('');
  const [estadoPieza, setEstadoPieza] = useState<'Buen Estado' | 'Defectuosa'>('Buen Estado');
  const [tipoReembolso, setTipoReembolso] = useState<'Efectivo' | 'Crédito'>('Efectivo');
  const [clienteId, setClienteId] = useState('');
  const [monto, setMonto] = useState<number | string>('');

  const inicializarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);

    const { data: prodData } = await supabase.from('productos').select('*').order('nombre');
    if (prodData) setProductos(prodData);

    const { data: cliData } = await supabase.from('clientes').select('*').order('nombre');
    if (cliData) setClientes(cliData);

    fetchHistorial();
  };

  const fetchHistorial = async () => {
    const { data } = await supabase
      .from('devoluciones')
      .select(`
        *,
        producto:productos(nombre, numero_parte),
        cliente:clientes(nombre)
      `)
      .order('created_at', { ascending: false });
    if (data) setHistorial(data);
  };

  useEffect(() => {
    inicializarDatos();
  }, []);

  // Autocompletar el monto sugerido cuando se selecciona un producto
  useEffect(() => {
    if (productoId) {
      const prod = productos.find(p => p.id === productoId);
      if (prod) {
        const cant = typeof cantidad === 'string' ? parseFloat(cantidad) : cantidad;
        if (!isNaN(cant)) setMonto(prod.precio_publico * cant);
      }
    }
  }, [productoId, cantidad]);

  const procesarDevolucion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !productoId || !monto) return;

    const cantNum = typeof cantidad === 'string' ? parseFloat(cantidad) : cantidad;
    const montoNum = typeof monto === 'string' ? parseFloat(monto) : monto;

    if (tipoReembolso === 'Crédito' && !clienteId) {
      alert('Debes seleccionar un cliente para abonar a su deuda.');
      return;
    }

    setProcesando(true);

    try {
      // 1. Guardar en la bitácora
      const { error: devError } = await supabase.from('devoluciones').insert([{
        producto_id: productoId,
        cliente_id: tipoReembolso === 'Crédito' ? clienteId : null,
        cantidad: cantNum,
        motivo,
        estado_pieza: estadoPieza,
        monto_reembolsado: montoNum,
        vendedor_id: userId
      }]);
      if (devError) throw devError;

      // 2. Si está en Buen Estado, regresamos la pieza al inventario
      if (estadoPieza === 'Buen Estado') {
        const prod = productos.find(p => p.id === productoId);
        if (prod) {
          const nuevoStock = Number(prod.stock_actual) + cantNum;
          await supabase.from('productos').update({ stock_actual: nuevoStock }).eq('id', productoId);
        }
      }

      // 3. Si es a Crédito, descontamos la deuda del cliente
      if (tipoReembolso === 'Crédito') {
        const cli = clientes.find(c => c.id === clienteId);
        if (cli) {
          // Evitamos que el saldo sea negativo
          const nuevoSaldo = Math.max(0, Number(cli.saldo_actual) - montoNum);
          await supabase.from('clientes').update({ saldo_actual: nuevoSaldo }).eq('id', clienteId);
        }
      }

      alert('¡Devolución procesada con éxito!');
      // Limpiar formulario
      setProductoId(''); setCantidad(1); setMotivo(''); setMonto(''); setClienteId('');
      inicializarDatos();

    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al procesar la devolución.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 p-4 gap-4 overflow-hidden">
      
      {/* Columna Izquierda: Formulario de Devolución */}
      <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-y-auto p-6">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Undo2 className="text-blue-600" /> Registrar Devolución
        </h2>

        <form onSubmit={procesarDevolucion} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Producto Devuelto</label>
            <select required value={productoId} onChange={(e) => setProductoId(e.target.value)} className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50">
              <option value="">-- Buscar Producto --</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.numero_parte} - {p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Cantidad</label>
              <input required type="number" step="0.1" min="0.1" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Monto a Reembolsar</label>
              <input required type="number" step="0.1" value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 font-bold text-blue-600" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Estado de la Pieza</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setEstadoPieza('Buen Estado')} className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${estadoPieza === 'Buen Estado' ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-white border-2 border-gray-200 text-gray-500'}`}>
                <CheckCircle size={18} /> Buen Estado
              </button>
              <button type="button" onClick={() => setEstadoPieza('Defectuosa')} className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${estadoPieza === 'Defectuosa' ? 'bg-red-100 text-red-700 border-2 border-red-500' : 'bg-white border-2 border-gray-200 text-gray-500'}`}>
                <AlertCircle size={18} /> Defectuosa
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {estadoPieza === 'Buen Estado' ? '* La pieza regresará al stock disponible.' : '* La pieza se registrará como merma (no vuelve al stock).'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Motivo / Notas</label>
            <input required type="text" value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. No le quedó al camión, venía rota..." className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50" />
          </div>

          <div className="border-t pt-4 mt-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Método de Reembolso</label>
            <div className="flex gap-4 mb-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={tipoReembolso === 'Efectivo'} onChange={() => setTipoReembolso('Efectivo')} className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-700">Entregar Efectivo</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={tipoReembolso === 'Crédito'} onChange={() => setTipoReembolso('Crédito')} className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-slate-700">Abonar a Deuda</span>
              </label>
            </div>

            {tipoReembolso === 'Crédito' && (
              <select required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full border border-blue-300 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-blue-50">
                <option value="">-- Seleccionar Transportista --</option>
                {clientes.filter(c => c.saldo_actual > 0).map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} (Debe: {formatCurrency(c.saldo_actual)})</option>
                ))}
              </select>
            )}
          </div>

          <button type="submit" disabled={procesando} className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl hover:bg-slate-800 transition disabled:opacity-50 mt-4 flex justify-center items-center gap-2">
            {procesando ? 'Guardando...' : <><RefreshCcw size={20} /> Procesar Devolución</>}
          </button>
        </form>
      </div>

      {/* Columna Derecha: Bitácora */}
      <div className="w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">Bitácora de Devoluciones</h2>
          <span className="text-sm font-medium text-gray-500">{historial.length} registros</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {historial.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <Undo2 size={48} className="mb-2 opacity-20" />
              <p>No hay devoluciones registradas</p>
            </div>
          ) : (
            <div className="space-y-3">
              {historial.map((dev) => (
                <div key={dev.id} className="border border-gray-200 rounded-xl p-4 flex justify-between items-center hover:bg-gray-50 transition">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${dev.estado_pieza === 'Buen Estado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {dev.estado_pieza}
                      </span>
                      {dev.cliente && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">Abono a {dev.cliente.nombre}</span>}
                    </div>
                    <p className="font-bold text-slate-800">{dev.producto?.numero_parte} - {dev.producto?.nombre}</p>
                    <p className="text-sm text-gray-500 mt-0.5">Motivo: {dev.motivo} (Cantidad: {dev.cantidad})</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(dev.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-lg text-slate-800">-{formatCurrency(dev.monto_reembolsado)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}