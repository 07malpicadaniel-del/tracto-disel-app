import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Producto } from '../types/database.types';
import { formatCurrency } from '../utils/formatters';
import ProductoModal from '../components/ProductoModal';
import { Pencil, Trash2, Search, Sparkles } from 'lucide-react';
import { groq } from '../lib/groq';

export default function InventarioPage() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);
  
  // Estados del buscador IA
  const [busqueda, setBusqueda] = useState('');
  const [buscandoIA, setBuscandoIA] = useState(false);
  const [idsRecomendadosIA, setIdsRecomendadosIA] = useState<string[] | null>(null);

  // Estado del Rol de Seguridad (Por defecto el más restringido)
  const [rolActivo, setRolActivo] = useState<string>('Mostrador');

  // Consulta para averiguar si el usuario es Administración
  const fetchPerfil = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', userData.user.id)
        .single();
      
      if (perfil) setRolActivo(perfil.rol);
    }
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setProductos(data);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductos();
    fetchPerfil(); // Ejecutamos la validación de rol al cargar la página
  }, []);

  const handleNuevoProducto = () => {
    setProductoAEditar(null);
    setIsModalOpen(true);
  };

  const handleEditarProducto = (producto: Producto) => {
    setProductoAEditar(producto);
    setIsModalOpen(true);
  };

  const handleEliminarProducto = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${nombre}"?`)) {
      try {
        setLoading(true);
        await supabase.from('productos').delete().eq('id', id);
        fetchProductos();
      } catch (error) {
        console.error('Error al eliminar:', error);
      }
    }
  };

  const handleBusquedaNormal = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBusqueda(e.target.value);
    setIdsRecomendadosIA(null); 
  };

  const ejecutarBusquedaIA = async () => {
    if (!busqueda.trim() || productos.length === 0) return;
    setBuscandoIA(true);

    try {
      const catalogoLigero = productos.map(p => ({
        id: p.id,
        nombre: p.nombre,
        aplicacion: p.aplicacion,
        numero_parte: p.numero_parte
      }));

      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "Eres un sistema de filtrado avanzado para una refaccionaria diésel. Recibirás un catálogo de productos en JSON y la solicitud de un cliente. Tu único trabajo es analizar el catálogo y responder EXCLUSIVAMENTE con un arreglo JSON en formato estricto con los 'id' de los productos que sirvan para la solicitud del cliente. No agregues texto extra, ni explicaciones, ni formato markdown. Ejemplo exacto de respuesta: [\"uuid1\", \"uuid2\"]"
          },
          {
            role: "user",
            content: `Solicitud del cliente: "${busqueda}"\nCatálogo: ${JSON.stringify(catalogoLigero)}`
          }
        ],
        model: "openai/gpt-oss-20b", 
        temperature: 0, 
      });

      const respuestaIA = completion.choices[0]?.message?.content || "[]";
      
      try {
        const cleanJson = respuestaIA.replace(/```json/g, '').replace(/```/g, '').trim();
        const idsExtraidos = JSON.parse(cleanJson);
        setIdsRecomendadosIA(Array.isArray(idsExtraidos) ? idsExtraidos : []);
      } catch (parseError) {
        console.error("Error al leer el JSON de la IA:", respuestaIA);
        alert("La IA devolvió un formato confuso. Intenta otra búsqueda.");
      }

    } catch (error) {
      console.error("Error en Groq:", error);
      alert("Hubo un problema de conexión con la IA.");
    } finally {
      setBuscandoIA(false);
    }
  };

  const productosFiltrados = productos.filter(producto => {
    if (idsRecomendadosIA !== null) {
      return idsRecomendadosIA.includes(producto.id);
    }
    const termino = busqueda.toLowerCase();
    return (
      producto.numero_parte.toLowerCase().includes(termino) ||
      producto.nombre.toLowerCase().includes(termino) ||
      (producto.aplicacion && producto.aplicacion.toLowerCase().includes(termino))
    );
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Catálogo de Productos</h1>
        {/* Solo el rol de Administración ve este botón */}
        {rolActivo === 'Administración' && (
          <button onClick={handleNuevoProducto} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium">
            + Nuevo Producto
          </button>
        )}
      </div>

      <div className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar normal o pregúntale a la IA (Ej. 'busco un filtro para ISX')..."
            value={busqueda}
            onChange={handleBusquedaNormal}
            onKeyDown={(e) => e.key === 'Enter' && busqueda.length > 3 && ejecutarBusquedaIA()}
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm shadow-sm"
          />
        </div>
        <button
          onClick={ejecutarBusquedaIA}
          disabled={buscandoIA || !busqueda}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition ${
            buscandoIA || !busqueda ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-sm'
          }`}
        >
          <Sparkles size={18} />
          {buscandoIA ? 'Analizando...' : 'Búsqueda IA'}
        </button>
      </div>
      
      {idsRecomendadosIA !== null && (
        <div className="mb-4 text-sm font-medium text-indigo-700 bg-indigo-50 p-3 rounded-lg border border-indigo-100 flex items-center gap-2">
          <Sparkles size={16} /> 
          La Inteligencia Artificial encontró {productosFiltrados.length} piezas relacionadas con tu consulta.
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 font-medium">Cargando inventario...</div>
        ) : productosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="font-medium text-lg text-slate-700 mb-1">No se encontraron productos</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-600">
                  <th className="p-4">No. Parte</th>
                  <th className="p-4">Nombre / Aplicación</th>
                  <th className="p-4">Stock</th>
                  {/* Columna visible solo para Administración */}
                  {rolActivo === 'Administración' && <th className="p-4 text-indigo-600">Costo (Secreto)</th>}
                  <th className="p-4">Precio Público</th>
                  {/* Acciones visibles solo para Administración */}
                  {rolActivo === 'Administración' && <th className="p-4">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((producto) => (
                  <tr key={producto.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                    <td className="p-4 font-semibold text-slate-800">{producto.numero_parte}</td>
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{producto.nombre}</div>
                      <div className="text-sm text-gray-500">{producto.aplicacion || 'Universal'}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        producto.stock_actual <= producto.stock_minimo 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {producto.stock_actual} {producto.unidad_medida}
                      </span>
                    </td>
                    
                    {/* Dato visible solo para Administración */}
                    {rolActivo === 'Administración' && (
                      <td className="p-4 font-medium text-indigo-600">
                        {formatCurrency(producto.costo_entrada)}
                      </td>
                    )}

                    <td className="p-4 font-medium text-slate-800">
                      {formatCurrency(producto.precio_publico)}
                    </td>

                    {/* Botones visibles solo para Administración */}
                    {rolActivo === 'Administración' && (
                      <td className="p-4 flex gap-3">
                        <button onClick={() => handleEditarProducto(producto)} className="text-blue-500 hover:text-blue-700 transition" title="Editar">
                          <Pencil size={18} />
                        </button>
                        <button onClick={() => handleEliminarProducto(producto.id, producto.nombre)} className="text-red-500 hover:text-red-700 transition" title="Eliminar">
                          <Trash2 size={18} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProductoModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchProductos} productoAEditar={productoAEditar} />
    </div>
  );
}