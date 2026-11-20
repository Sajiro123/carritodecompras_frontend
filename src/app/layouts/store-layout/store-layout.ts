import { Component, HostListener, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { BRAND_CONFIG } from '../../core/brand.config';
import { CartService } from '../../services/cart.service';
import { CatalogFilterService, CollectionMenuKey } from '../../services/catalog-filter.service';
import { CartDrawer } from '../../components/cart-drawer/cart-drawer';

interface NavCollectionItem {
  key: CollectionMenuKey;
  label: string;
  hasMegaMenu?: boolean;
}

@Component({
  selector: 'app-store-layout',
  imports: [RouterOutlet, RouterLink, FormsModule, CartDrawer],
  templateUrl: './store-layout.html',
  styleUrl: './store-layout.scss',
})
export class StoreLayout {
  readonly brand = BRAND_CONFIG;
  readonly cart = inject(CartService);
  readonly catalogFilter = inject(CatalogFilterService);
  private readonly router = inject(Router);

  readonly isNicheMenuOpen = signal(false);
  readonly isUserMenuOpen = signal(false);

  private searchTimer: ReturnType<typeof setTimeout> | null = null;
  private megaMenuCloseTimer: ReturnType<typeof setTimeout> | null = null;

  readonly navItems: NavCollectionItem[] = [
    { key: 'hombre', label: 'HOMBRE' },
    { key: 'mujer', label: 'MUJER' },
    { key: 'nicho', label: 'MARCAS NICHO & DISEÑADOR', hasMegaMenu: true },
    { key: 'ocasiones', label: 'OCASIONES ESPECIALES' },
    { key: 'decants', label: 'DECANTS & SETS' },
    { key: 'promociones', label: 'PROMOCIONES & DESCUENTO' },
  ];

  readonly nicheHouses = [
    { name: 'Parfums de Marly', origin: 'Francia · Versalles' },
    { name: 'Creed', origin: 'Francia · Maison 1760' },
    { name: 'Nishane', origin: 'Estambul · Extrait' },
    { name: 'Xerjoff 1861', origin: 'Italia · Turín' },
    { name: 'Initio Privés', origin: 'Francia · Alta Nicho' },
    { name: 'Maison Francis Kurkdjian', origin: 'París · Alta Costura' },
    { name: 'Byredo', origin: 'Estocolmo · Vanguardia' },
  ];

  readonly designerHouses = [
    { name: 'Tom Ford', origin: 'Private Blend' },
    { name: 'Dior', origin: 'La Collection & Elixir' },
    { name: 'Yves Saint Laurent', origin: 'Le Vestiaire & Intense' },
  ];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (!target.closest('.user-menu-wrap')) {
      this.isUserMenuOpen.set(false);
    }
    if (!target.closest('.mega-menu-trigger-wrap')) {
      this.isNicheMenuOpen.set(false);
    }
  }

  isOnHomeRoute(): boolean {
    return this.router.url === '/' || this.router.url === '';
  }

  isOnCatalogRoute(): boolean {
    return this.router.url.startsWith('/catalogo');
  }

  onBrandClick(event: Event): void {
    event.preventDefault();
    this.catalogFilter.resetAll();
    this.isNicheMenuOpen.set(false);
    this.router.navigate(['/']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onHeaderSearchInput(value: string): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.searchTimer = setTimeout(() => {
      this.catalogFilter.setSearchQuery(value);
      if (value.trim() && !this.isOnCatalogRoute()) {
        this.router.navigate(['/catalogo']);
      }
    }, 280);
  }

  onHeaderSearchSubmit(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
    this.catalogFilter.setSearchQuery(this.catalogFilter.searchQuery());
    if (!this.isOnCatalogRoute()) {
      this.router.navigate(['/catalogo']);
    }
  }

  clearHeaderSearch(): void {
    this.catalogFilter.setSearchQuery('');
  }

  selectNavTab(key: CollectionMenuKey): void {
    this.isNicheMenuOpen.set(false);
    this.catalogFilter.selectCollection(key);
    if (!this.isOnCatalogRoute()) {
      this.router.navigate(['/catalogo']);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectHouseBrand(brandName: string): void {
    this.isNicheMenuOpen.set(false);
    this.catalogFilter.selectBrand(brandName);
    if (!this.isOnCatalogRoute()) {
      this.router.navigate(['/catalogo']);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openNicheMenu(): void {
    if (this.megaMenuCloseTimer) {
      clearTimeout(this.megaMenuCloseTimer);
      this.megaMenuCloseTimer = null;
    }
    this.isNicheMenuOpen.set(true);
  }

  scheduleCloseNicheMenu(): void {
    this.megaMenuCloseTimer = setTimeout(() => {
      this.isNicheMenuOpen.set(false);
    }, 180);
  }

  toggleFavoritesView(): void {
    const nextTab: CollectionMenuKey =
      this.isOnCatalogRoute() && this.catalogFilter.activeTab() === 'favoritos'
        ? 'all'
        : 'favoritos';
    this.catalogFilter.selectCollection(nextTab);
    if (!this.isOnCatalogRoute()) {
      this.router.navigate(['/catalogo']);
    }
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.isUserMenuOpen.set(false);
  }

  openCart(event: Event): void {
    event.preventDefault();
    this.cart.openDrawer();
  }
}
