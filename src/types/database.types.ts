export interface Categoria {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Producto {
  id: string;
  nombre: string;
  numero_parte: string;
  aplicacion?: string;
  costo_entrada: number;
  precio_publico: number;
  unidad_medida: 'pieza' | 'litro' | 'metro';
  stock_actual: number;
  stock_minimo: number;
  categoria_id?: string;
}