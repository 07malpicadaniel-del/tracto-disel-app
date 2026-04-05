import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Producto } from '../types/database.types';

interface ProductoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productoAEditar?: Producto | null; // Recibimos el producto si es edición
}

export default function ProductoModal({ isOpen, onClose, onSuccess, productoAEditar }: ProductoModalProps) {
  const [loading, setLoading] = useState(false);
  
  const estadoInicial = {
    nombre: '',
    numero_parte: '',
    aplicacion: '',
    costo_entrada: 0,
    precio_publico: 0,
    unidad_medida: 'pieza',
    stock_actual: 0,
    stock_minimo: 5,
  };

  const [formData, setFormData] = useState(estadoInicial);

  // Cada vez que se abre el modal o cambia el producto a editar, llenamos o vaciamos el formulario
  useEffect(() => {
    if (productoAEditar) {
      setFormData({
        nombre: productoAEditar.nombre,
        numero_parte: productoAEditar.numero_parte,
        aplicacion: productoAEditar.aplicacion || '',
        costo_entrada: productoAEditar.costo_entrada,
        precio_publico: productoAEditar.precio_publico,
        unidad_medida: productoAEditar.unidad_medida,
        stock_actual: productoAEditar.stock_actual,
        stock_minimo: productoAEditar.stock_minimo,
      });
    } else {
      setFormData(estadoInicial);
    }
  }, [productoAEditar, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['costo_entrada', 'precio_publico', 'stock_actual', 'stock_minimo'].includes(name)
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (productoAEditar) {
        // Lógica para ACTUALIZAR
        const { error } = await supabase
          .from('productos')
          .update(formData)
          .eq('id', productoAEditar.id);
        if (error) throw error;
      } else {
        // Lógica para INSERTAR nuevo
        const { error } = await supabase
          .from('productos')
          .insert([formData]);
        if (error) throw error;
      }

      onSuccess(); 
      onClose();   
    } catch (error) {
      console.error('Error al guardar:', error);
      alert('Hubo un error al guardar. Verifica que el número de parte no esté repetido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">
          {productoAEditar ? 'Editar Producto' : 'Nuevo Producto'}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-5">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre de la pieza</label>
            <input required type="text" name="nombre" value={formData.nombre} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Filtro de Aceite" />
          </div>
          
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Número de Parte</label>
            <input required type="text" name="numero_parte" value={formData.numero_parte} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. LF9009" />
          </div>
          
          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Aplicación (Opcional)</label>
            <input type="text" name="aplicacion" value={formData.aplicacion} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej. Motor Cummins ISX" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Costo de Entrada ($)</label>
            <input required type="number" step="0.01" name="costo_entrada" value={formData.costo_entrada || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none" />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Precio al Público ($)</label>
            <input required type="number" step="0.01" name="precio_publico" value={formData.precio_publico || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Unidad de Venta</label>
            <select name="unidad_medida" value={formData.unidad_medida} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none">
              <option value="pieza">Pieza (Unidad)</option>
              <option value="litro">Litro (A granel)</option>
              <option value="metro">Metro (A granel)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Actual</label>
            <input required type="number" step="0.01" name="stock_actual" value={formData.stock_actual || ''} onChange={handleChange} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none" />
          </div>

          <div className="col-span-2 flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Cancelar</button>
            <button type="submit" disabled={loading} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? 'Guardando...' : productoAEditar ? 'Actualizar Cambios' : 'Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}