export interface CreateOrderPayload {
  contacto: {
    nombre: string;
    telefono: string;
    email: string;
  };
  entrega: {
    tipo: 'DOMICILIO' | 'SHALOM' | 'TIENDA';
    ubigeoCodigo?: string | null;
    direccion?: string | null;
    referencia?: string | null;
    tiendaId?: number | null;
    agenciaId?: number | null;
    receptorNombre?: string | null;
    receptorDni?: string | null;
  };
  comprobante: {
    tipo: 'BOLETA' | 'FACTURA';
    tipoDocumento: string;
    numeroDocumento: string;
    razonSocial?: string | null;
    direccionFiscal?: string | null;
  };
  pago: {
    metodo: 'BCP' | 'YAPE_PLIN' | 'CULQI' | 'FLOW';
  };
  items: {
    productId: number;
    quantity: number;
  }[];
}

export interface OrderResponse {
  orderId: number;
  codigoSeguimiento: string;
  subtotal: number;
  costoEnvio: number;
  total: number;
  status: string;
}

export interface OrderItemDetail {
  productId: number;
  productName: string;
  productImageUrl?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderDetail {
  id: number;
  codigoSeguimiento: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tipoEntrega: 'DOMICILIO' | 'SHALOM' | 'TIENDA';
  ubigeoCodigo?: string | null;
  direccionEnvio?: string | null;
  referenciaEnvio?: string | null;
  tiendaId?: number | null;
  agenciaId?: number | null;
  receptorNombre?: string | null;
  receptorDni?: string | null;
  tipoComprobante: 'BOLETA' | 'FACTURA';
  tipoDocumento: string;
  numeroDocumento: string;
  razonSocial?: string | null;
  direccionFiscal?: string | null;
  metodoPago: string;
  subtotal: number;
  costoEnvio: number;
  total: number;
  status: 'PENDING' | 'PAID' | 'PREPARING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  items: OrderItemDetail[];
}
