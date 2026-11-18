import { Injectable, computed, effect, signal } from '@angular/core';
import { CartItem } from '../models/cart-item';
import { Product } from '../models/product';

const STORAGE_KEY = 'shop_cart';
export const FREE_SHIPPING_THRESHOLD = 300.0;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>(this.loadFromStorage());
  private readonly _isDrawerOpen = signal<boolean>(false);

  readonly items = this._items.asReadonly();
  readonly isDrawerOpen = this._isDrawerOpen.asReadonly();

  readonly count = computed(() => this._items().reduce((acc, item) => acc + item.quantity, 0));

  readonly subtotal = computed(() =>
    this._items().reduce((acc, item) => acc + item.product.price * item.quantity, 0),
  );

  // Alias compatible con total
  readonly total = this.subtotal;

  readonly freeShippingThreshold = FREE_SHIPPING_THRESHOLD;

  readonly freeShippingProgress = computed(() => {
    const sub = this.subtotal();
    if (FREE_SHIPPING_THRESHOLD <= 0) return 100;
    const pct = (sub / FREE_SHIPPING_THRESHOLD) * 100;
    return Math.min(100, Math.max(0, Math.round(pct * 10) / 10));
  });

  readonly remainingForFreeShipping = computed(() => {
    const diff = FREE_SHIPPING_THRESHOLD - this.subtotal();
    return diff > 0 ? Number(diff.toFixed(2)) : 0;
  });

  readonly hasFreeShipping = computed(() => this.subtotal() >= FREE_SHIPPING_THRESHOLD);

  readonly freeShippingMessage = computed(() => {
    if (this.hasFreeShipping()) {
      return '¡Felicidades, tienes envío gratis!';
    }
    return `¡Te faltan S/ ${this.remainingForFreeShipping().toFixed(2)} para tener envío gratis!`;
  });

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._items()));
      } catch (e) {
        console.error('Error guardando carrito en localStorage', e);
      }
    });
  }

  openDrawer(): void {
    this._isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this._isDrawerOpen.set(false);
  }

  toggleDrawer(): void {
    this._isDrawerOpen.update((open) => !open);
  }

  add(product: Product, quantity = 1): void {
    if (product.stock <= 0) return;

    this._items.update((items) => {
      const found = items.find((i) => i.product.id === product.id);
      if (!found) {
        const qty = Math.min(quantity, product.stock);
        return [...items, { product, quantity: qty }];
      }
      const newQty = Math.min(found.quantity + quantity, product.stock);
      return items.map((i) => (i.product.id === product.id ? { ...i, quantity: newQty } : i));
    });

    this.openDrawer();
  }

  increment(productId: number): void {
    this._items.update((items) =>
      items.map((i) => {
        if (i.product.id === productId) {
          if (i.quantity < i.product.stock) {
            return { ...i, quantity: i.quantity + 1 };
          }
        }
        return i;
      }),
    );
  }

  decrement(productId: number): void {
    this._items.update((items) =>
      items
        .map((i) => {
          if (i.product.id === productId) {
            return { ...i, quantity: i.quantity - 1 };
          }
          return i;
        })
        .filter((i) => i.quantity > 0),
    );
  }

  setQuantity(productId: number, quantity: number): void {
    if (quantity < 1) {
      this.remove(productId);
      return;
    }
    this._items.update((items) =>
      items.map((i) => {
        if (i.product.id === productId) {
          const clamped = Math.min(Math.max(1, quantity), i.product.stock);
          return { ...i, quantity: clamped };
        }
        return i;
      }),
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
