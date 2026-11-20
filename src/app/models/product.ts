export interface Product {
  id: number;
  name: string;
  slug?: string;
  description: string | null;
  price: number;
  originalPrice?: number | null;
  samplePrice?: number | null;
  stock: number;
  imageUrl: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  brand?: string | null;
  olfactoryFamily?: string | null;
  concentration?: string | null;
  occasion?: string | null;
  volumeLabel?: string | null;
  formatType?: string | null;
  notes?: string | null;
  badge?: string | null;
  badgeTone?: 'dark' | 'gold' | 'red' | 'soft' | string | null;
  rating?: number | null;
  reviewsCount?: number | null;
  gender?: string | null;
  isNiche?: boolean | null;
  fastDeliveryLima?: boolean | null;
}

export interface FilterFacet {
  label: string;
  count: number;
}

export interface CreateProductRequest {
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string;
}
