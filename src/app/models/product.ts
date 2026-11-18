export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
}

export interface CreateProductRequest {
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string;
}
