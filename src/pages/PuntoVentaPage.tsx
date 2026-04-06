import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Producto } from '../types/database.types';
import { formatCurrency } from '../utils/formatters';
import { Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle, CreditCard, Banknote } from 'lucide-react';

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

export default function PuntoVentaPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<any[]>([]); // Nuevo estado para clientes
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Estados para el Método de Pago
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Crédito'>('Efectivo');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('');

  const inicializarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);

    const { data: prodData } = await supabase.from('productos').select('*').order('nombre');
    if (prodData) setProductos(prodData);

    // Cargamos los clientes para el dropdown
    const { data: cliData } = await supabase.from('clientes').select('*').order('nombre');
    if (cliData) setClientes(cliData);
  };

  useEffect(() => {
    inicializarDatos();
  }, []);

  const productosFiltrados = productos.filter(p =>
    p.numero_parte.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito(prev => {
      const existe = prev.find(item => item.producto.id === producto.id);
      if (existe) {
        return prev.map(item => item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const actualizarCantidad = (id: string, nuevaCantidad: number | string) => {
    const cantidad = typeof nuevaCantidad === 'string' ? parseFloat(nuevaCantidad) : nuevaCantidad;
    if (isNaN(cantidad) || cantidad <= 0) return;
    setCarrito(prev => prev.map(item => item.producto.id === id ? { ...item, cantidad } : item));
  };

  const eliminarDelCarrito = (id: string) => {
    setCarrito(prev => prev.filter(item => item.producto.id !== id));
  };

  const total = carrito.reduce((sum, item) => sum + (item.producto.precio_publico * item.cantidad), 0);

  const procesarVenta = async () => {
    if (carrito.length === 0 || !userId) return;
    
    // Validación de seguridad para créditos
    if (metodoPago === 'Crédito' && !clienteSeleccionado) {
      alert('Debes seleccionar un cliente para realizar una venta a crédito.');
      return;
    }

    setProcesando(true);

    try {
      // 1. Creamos el Ticket General
      const { data: ventaData, error: ventaError } = await supabase
        .from('ventas')
        .insert([{
          total: total,
          metodo_pago: metodoPago, 
          estado: metodoPago === 'Crédito' ? 'Deuda' : 'Completada', // Si es crédito, queda como deuda
          vendedor_id: userId,
          cliente_id: metodoPago === 'Crédito' ? clienteSeleccionado : null // Asignamos el cliente si aplica
        }])
        .select()
        .single();

      if (ventaError) throw ventaError;

      // 2. Guardamos los items de la venta
      const itemsVenta = carrito.map(item => ({
        venta_id: ventaData.id,
        producto_id: item.producto.id,
        cantidad: item.cantidad,
        precio_unitario: item.producto.precio_publico,
        subtotal: item.cantidad * item.producto.precio_publico
      }));

      const { error: itemsError } = await supabase.from('ventas_items').insert(itemsVenta);
      if (itemsError) throw itemsError;

      // 3. Descontamos el stock
      for (const item of carrito) {
        const nuevoStock = item.producto.stock_actual - item.cantidad;
        await supabase.from('productos').update({ stock_actual: nuevoStock }).eq('id', item.producto.id);
      }

      // 4. Si fue a crédito, sumamos la deuda al saldo del cliente
      if (metodoPago === 'Crédito') {
        const clienteObj = clientes.find(c => c.id === clienteSeleccionado);
        if (clienteObj) {
          const nuevoSaldo = Number(clienteObj.saldo_actual) + total;
          await supabase.from('clientes').update({ saldo_actual: nuevoSaldo }).eq('id', clienteSeleccionado);
        }
      }

      alert('¡Venta registrada con éxito!');
      setCarrito([]);
      setBusqueda('');
      setMetodoPago('Efectivo');
      setClienteSeleccionado('');
      await inicializarDatos();

    } catch (error) {
      console.error('Error procesando venta:', error);
      alert('Hubo un error al procesar el cobro.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 p-4 gap-4 overflow-hidden">
      
      <div className="w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-white">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Punto de Venta</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input type="text" placeholder="Buscar por número de parte o nombre..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {productosFiltrados.slice(0, 20).map(producto => (
              <div key={producto.id} onClick={() => agregarAlCarrito(producto)} className="border border-gray-200 p-4 rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-md transition bg-white">
                <p className="font-bold text-slate-800">{producto.numero_parte}</p>
                <p className="text-sm text-gray-500 truncate">{producto.nombre}</p>
                <div className="mt-3 flex justify-between items-end">
                  <p className="font-bold text-blue-600">{formatCurrency(producto.precio_publico)}</p>
                  <p className={`text-xs font-semibold ${producto.stock_actual <= producto.stock_minimo ? 'text-red-500' : 'text-green-600'}`}>Stock: {producto.stock_actual}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-1/3 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-slate-900 text-white flex items-center gap-2">
          <ShoppingCart size={20} className="text-blue-400"/>
          <h2 className="text-lg font-bold">Ticket de Venta</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingCart size={48} className="mb-2 opacity-20" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {carrito.map(item => (
                <li key={item.producto.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{item.producto.numero_parte}</p>
                      <p className="text-xs text-gray-500">{item.producto.nombre}</p>
                    </div>
                    <button onClick={() => eliminarDelCarrito(item.producto.id)} className="text-red-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
                      <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad - 1)} className="p-1 hover:bg-gray-100 rounded"><Minus size={14}/></button>
                      <input type="number" step="0.1" value={item.cantidad} onChange={(e) => actualizarCantidad(item.producto.id, e.target.value)} className="w-12 text-center text-sm font-bold outline-none" />
                      <button onClick={() => actualizarCantidad(item.producto.id, item.cantidad + 1)} className="p-1 hover:bg-gray-100 rounded"><Plus size={14}/></button>
                    </div>
                    <p className="font-bold text-slate-800">{formatCurrency(item.producto.precio_publico * item.cantidad)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold text-gray-600">Total:</span>
            <span className="text-3xl font-bold text-slate-800">{formatCurrency(total)}</span>
          </div>

          {/* Selector de Método de Pago */}
          <div className="mb-4 grid grid-cols-2 gap-2">
            <button 
              onClick={() => setMetodoPago('Efectivo')}
              className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${metodoPago === 'Efectivo' ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-white border-2 border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              <Banknote size={18} /> Efectivo
            </button>
            <button 
              onClick={() => setMetodoPago('Crédito')}
              className={`py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition ${metodoPago === 'Crédito' ? 'bg-blue-100 text-blue-700 border-2 border-blue-500' : 'bg-white border-2 border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              <CreditCard size={18} /> Crédito
            </button>
          </div>

          {/* Selector de Cliente (Solo visible si es Crédito) */}
          {metodoPago === 'Crédito' && (
            <div className="mb-4">
              <select 
                value={clienteSeleccionado} 
                onChange={(e) => setClienteSeleccionado(e.target.value)}
                className="w-full border-2 border-blue-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-white text-slate-700 font-medium"
              >
                <option value="">-- Selecciona un Transportista --</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} (Deuda actual: {formatCurrency(c.saldo_actual)})</option>
                ))}
              </select>
            </div>
          )}

          <button 
            onClick={procesarVenta}
            disabled={carrito.length === 0 || procesando}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg flex justify-center items-center gap-2"
          >
            {procesando ? 'Procesando...' : <><CheckCircle size={24} /> {metodoPago === 'Efectivo' ? 'Cobrar Efectivo' : 'Cargar a Cuenta'}</>}
          </button>
        </div>
      </div>

    </div>
  );
}