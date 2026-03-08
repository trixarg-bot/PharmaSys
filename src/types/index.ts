export interface Medicamento {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  cantidad: number;
  fecha_vencimiento: string;
  created_at: string;
  updated_at: string;
}

export interface Venta {
  id: number;
  total: number;
  fecha: string;
  created_at: string;
  detalles?: VentaDetalle[];
}

export interface VentaDetalle {
  id: number;
  venta_id: number;
  medicamento_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  medicamento_nombre?: string;
}

export interface ItemCarrito {
  medicamento_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  stock_disponible: number;
  subtotal: number;
}
