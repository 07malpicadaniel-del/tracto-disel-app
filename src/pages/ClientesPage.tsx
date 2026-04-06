import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/formatters';
import { Users, Plus, DollarSign, Trash2 } from 'lucide-react';

// Definimos la estructura del cliente según nuestra base de datos
interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  limite_credito: number;
  saldo_actual: number;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para el formulario de nuevo cliente
  const [formData, setFormData] = useState({ nombre: '', telefono: '', limite_credito: 0 });

  const fetchClientes = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('clientes').select('*').order('nombre');
    if (!error && data) setClientes(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  const handleCrearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('clientes').insert([{
        nombre: formData.nombre,
        telefono: formData.telefono,
        limite_credito: formData.limite_credito,
        saldo_actual: 0 // Inician sin deuda
      }]);
      if (error) throw error;
      
      setIsModalOpen(false);
      setFormData({ nombre: '', telefono: '', limite_credito: 0 });
      fetchClientes();
    } catch (error) {
      console.error('Error al crear cliente:', error);
      alert('Hubo un error al registrar al cliente.');
    }
  };

  const handleAbonar = async (cliente: Cliente) => {
    if (cliente.saldo_actual <= 0) {
      alert('Este cliente no tiene deudas pendientes.');
      return;
    }

    const montoAbono = window.prompt(`¿Cuánto va a abonar ${cliente.nombre}?\nDeuda actual: ${formatCurrency(cliente.saldo_actual)}`);
    if (!montoAbono) return;

    const cantidad = parseFloat(montoAbono);
    if (isNaN(cantidad) || cantidad <= 0) {
      alert('Por favor ingresa una cantidad válida.');
      return;
    }

    if (cantidad > cliente.saldo_actual) {
      alert('El abono no puede ser mayor a la deuda actual.');
      return;
    }

    try {
      const nuevoSaldo = cliente.saldo_actual - cantidad;
      const { error } = await supabase.from('clientes').update({ saldo_actual: nuevoSaldo }).eq('id', cliente.id);
      if (error) throw error;
      
      alert(`Abono registrado. Nuevo saldo: ${formatCurrency(nuevoSaldo)}`);
      fetchClientes();
    } catch (error) {
      console.error('Error al abonar:', error);
      alert('Error al registrar el abono.');
    }
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar a ${nombre}?`)) {
      await supabase.from('clientes').delete().eq('id', id);
      fetchClientes();
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Users className="text-blue-600" />
          Directorio de Clientes
        </h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2">
          <Plus size={20} /> Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-medium">Cargando clientes...</div>
        ) : clientes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No hay clientes registrados.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                <th className="p-4">Nombre / Empresa</th>
                <th className="p-4">Teléfono</th>
                <th className="p-4">Límite de Crédito</th>
                <th className="p-4">Deuda Actual</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="p-4 font-bold text-slate-800">{cliente.nombre}</td>
                  <td className="p-4 text-gray-600">{cliente.telefono || 'N/A'}</td>
                  <td className="p-4 font-medium text-gray-600">{formatCurrency(cliente.limite_credito)}</td>
                  <td className="p-4">
                    <span className={`font-bold ${cliente.saldo_actual > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(cliente.saldo_actual)}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    <button onClick={() => handleAbonar(cliente)} className="bg-green-100 text-green-700 px-3 py-1.5 rounded hover:bg-green-200 transition font-semibold text-sm flex items-center gap-1">
                      <DollarSign size={16} /> Abonar
                    </button>
                    <button onClick={() => handleEliminar(cliente.id, cliente.nombre)} className="text-red-400 hover:text-red-600 ml-2">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Simplificado Integrado */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Registrar Cliente</h2>
            <form onSubmit={handleCrearCliente} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre / Transportista</label>
                <input required type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500" placeholder="Ej. Transportes Martínez" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                <input type="text" value={formData.telefono} onChange={e => setFormData({...formData, telefono: e.target.value})} className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500" placeholder="Ej. 555-123-4567" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Límite de Crédito ($)</label>
                <input required type="number" value={formData.limite_credito || ''} onChange={e => setFormData({...formData, limite_credito: parseFloat(e.target.value) || 0})} className="w-full border rounded-lg p-2.5 outline-none focus:border-blue-500" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Guardar Cliente</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}