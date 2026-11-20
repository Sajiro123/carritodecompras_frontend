import { Injectable, computed, effect, signal } from '@angular/core';

export type CollectionMenuKey =
  | 'all'
  | 'hombre'
  | 'mujer'
  | 'nicho'
  | 'ocasiones'
  | 'decants'
  | 'promociones'
  | 'favoritos';

const WISHLIST_STORAGE_KEY = 'aroma_atelier_wishlist';

@Injectable({ providedIn: 'root' })
export class CatalogFilterService {
  private readonly _activeTab = signal<CollectionMenuKey>('all');
  private readonly _searchQuery = signal<string>('');
  private readonly _selectedBrandFromNav = signal<string | null>(null);
  private readonly _wishlistIds = signal<number[]>(this.loadWishlist());
  private readonly _navVersion = signal<number>(0);

  readonly activeTab = this._activeTab.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly selectedBrandFromNav = this._selectedBrandFromNav.asReadonly();
  readonly wishlistIds = this._wishlistIds.asReadonly();
  readonly navVersion = this._navVersion.asReadonly();

  readonly wishlistCount = computed(() => this._wishlistIds().length);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(this._wishlistIds()));
      } catch {
        // ignore storage errors
      }
    });
  }

  selectCollection(tab: CollectionMenuKey): void {
    this._activeTab.set(tab);
    this._selectedBrandFromNav.set(null);
    this._navVersion.update((v) => v + 1);
  }

  selectBrand(brand: string): void {
    this._activeTab.set('nicho');
    this._selectedBrandFromNav.set(brand);
    this._navVersion.update((v) => v + 1);
  }

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
    this._navVersion.update((v) => v + 1);
  }

  syncSearchQuerySilently(query: string): void {
    this._searchQuery.set(query);
  }

  syncActiveTabSilently(tab: CollectionMenuKey): void {
    this._activeTab.set(tab);
  }

  resetAll(): void {
    this._activeTab.set('all');
    this._searchQuery.set('');
    this._selectedBrandFromNav.set(null);
    this._navVersion.update((v) => v + 1);
  }

  toggleWishlist(productId: number): void {
    this._wishlistIds.update((ids) =>
      ids.includes(productId) ? ids.filter((id) => id !== productId) : [...ids, productId]
    );
  }

  isWishlisted(productId: number): boolean {
    return this._wishlistIds().includes(productId);
  }

  private loadWishlist(): number[] {
    try {
      const raw = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
    } catch {
      return [];
    }
  }
}
