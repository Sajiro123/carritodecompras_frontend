import { Injectable, computed, effect, signal } from '@angular/core';
import { CartItem } from '../models/cart-item';
import { Product } from '../models/product';

const STORAGE_KEY = 'shop_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>(this.loadFromStorage());

  readonly items = this._items.asReadonly();
  readonly count = computed(() => this._items().reduce((acc, item) => acc + item.quantity, 0));
  readonly total = computed(() =>
    this._items().reduce((acc, item) => acc + item.product.price * item.quantity, 0),
  );

  constructor() {
    effect(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items()));
    });
  }

  add(product: Product): void {
    this._items.update((items) => {
      const found = items.find((i) => i.product.id === product.id);
      if (!found) {
        return product.stock > 0 ? [...items, { product, quantity: 1 }] : items;
      }
      if (found.quantity >= product.stock) {
        return items;
      }
      return items.map((i) => (i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    });
  }

  setQuantity(productId: number, quantity: number): void {
    if (quantity < 1) {
      this.remove(productId);
      return;
    }
    this._items.update((items) =>
      items.map((i) =>
        i.product.id === productId
          ? { ...i, quantity: Math.min(quantity, i.product.stock) }
          : i,
      ),
    );
  }

  remove(productId: number): void {
    this._items.update((items) => items.filter((i) => i.product.id !== productId));
  }

  clear(): void {
    this._items.set([]);
  }

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  }
}
