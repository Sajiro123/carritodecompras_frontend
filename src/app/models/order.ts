export interface CreateOrderPayload {
  customer: {
    name: string;
    email: string;
    phone?: string;
    address: string;
  };
  items: {
    productId: number;
    quantity: number;
  }[];
}

export interface OrderResponse {
  orderId: number;
  total: number;
  status: string;
}

export interface OrderDetail {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  address: string;
  total: number;
  status: string;
  createdAt: string;
  items: {
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
}
