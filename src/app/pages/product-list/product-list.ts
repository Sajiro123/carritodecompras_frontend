import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FilterFacet, Product } from '../../models/product';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { CatalogFilterService, CollectionMenuKey } from '../../services/catalog-filter.service';

interface CollectionHeroMeta {
  breadcrumb: string[];
  title: string;
  description: string;
}

const COLLECTION_HERO: Record<CollectionMenuKey, CollectionHeroMeta> = {
  all: {
    breadcrumb: ['INICIO', 'ALTA PERFUMERÍA'],
    title: 'Colección Exclusiva de Alta Perfumería',
    description:
      'Composiciones olfativas de alta estela y magnetismo seleccionadas de las casas nicho y diseñadores más prestigiosos del mundo. Disponibles en frasco sellado o decants oficiales certificados.',
  },
  hombre: {
    breadcrumb: ['INICIO', 'HOMBRE', 'ALTA PERFUMERÍA'],
    title: 'Fragancias Masculinas & Unisex',
    description:
      'Maderas nobles, especias cálidas, cuero ahumado y cítricos vibrantes diseñados para proyectar carácter, elegancia y distinción en cada ocasión.',
  },
  mujer: {
    breadcrumb: ['INICIO', 'MUJER', 'ALTA PERFUMERÍA'],
    title: 'Fragancias Femeninas & Extractos',
    description:
      'Bouquets de rosa turca, azafrán luminoso, vainilla aterciopelada y flores blancas de máxima fijación para dejar una huella inolvidable.',
  },
  nicho: {
    breadcrumb: ['INICIO', 'MARCAS NICHO & DISEÑADOR'],
    title: 'Marcas Nicho & Alta Perfumería Independiente',
    description:
      'Creaciones artesanales de Parfums de Marly, Creed, Nishane, Xerjoff, Initio, Maison Francis Kurkdjian, Byredo y Tom Ford Private Blend con lotes verificados en Lima.',
  },
  ocasiones: {
    breadcrumb: ['INICIO', 'OCASIONES ESPECIALES'],
    title: 'Fragancias para Ocasiones Especiales — Gala & Noche',
    description:
      'Composiciones olfativas de alta estela y magnetismo diseñadas para galas de etiqueta, veladas íntimas y celebraciones memorables con opciones en frasco sellado o decant.',
  },
  decants: {
    breadcrumb: ['INICIO', 'DECANTS & SETS'],
    title: 'Decants Oficiales & Discovery Sets',
    description:
      'Descubre el universo nicho en tu piel antes de invertir en el frasco completo. Atomizadores oficiales de 5ml y 10ml extraídos al momento de frascos 100% originales.',
  },
  promociones: {
    breadcrumb: ['INICIO', 'PROMOCIONES & DESCUENTO'],
    title: 'Selección con Descuento Exclusivo',
    description:
      'Oportunidades limitadas en fragancias icónicas, elixires y sets curados con stock inmediato para entrega express en Lima y envíos asegurados a provincias.',
  },
  favoritos: {
    breadcrumb: ['INICIO', 'MIS FAVORITOS'],
    title: 'Tu Colección de Fragancias Favoritas',
    description:
      'Las composiciones que guardaste para comparar notas olfativas, probar en muestra de 5ml o sumar a tu colección personal.',
  },
};

@Component({
  selector: 'app-product-list',
  imports: [DecimalPipe, FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly cart = inject(CartService);
  readonly catalogFilter = inject(CatalogFilterService);

  readonly products = signal<Product[]>([]);
  readonly availableFamilias = signal<FilterFacet[]>([]);
  readonly availableConcentraciones = signal<string[]>(['EDP', 'Extrait', 'EDT', 'Elixir']);
  readonly availableOcasiones = signal<string[]>([
    'Citas Románticas',
    'Noche & Gala',
    'Oficina / Firma',
    'Club & Fiesta',
    'Verano & Fresco',
  ]);
  readonly availableFormatos = signal<string[]>([
    'Frasco 100ml+',
    'Frasco 50-90ml',
    'Decant 5ml / 10ml',
    'Discovery Set',
  ]);
  readonly availableMarcas = signal<FilterFacet[]>([]);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly addedMessage = signal('');

  // Filtros de Perfumería
  q = '';
  selectedGender: string | null = null;
  onlyNiche = false;
  selectedFamilias: string[] = [];
  selectedConcentraciones: string[] = [];
  selectedOcasiones: string[] = [];
  selectedFormatos: string[] = [];
  selectedMarcas: string[] = [];
  soloDescuento = false;
  entrega24h = false;
  onlyFavorites = false;
  minPrecio: number | null = null;
  maxPrecio: number | null = null;
  priceSliderValue = 1800;

  sort = 'bestsellers';
  page = 0;
  readonly pageSize = 9;
  totalPages = 1;
  totalElements = 0;

  dbMinPrice = 0;
  dbMaxPrice = 1800;

  // Estado UI
  gridDensity: 'normal' | 'compact' = 'normal';
  isMobileFilterOpen = false;

  // Secciones colapsables
  sectionsOpen: Record<string, boolean> = {
    precio: true,
    familia: true,
    concentracion: true,
    ocasion: true,
    formato: false,
    marcas: true,
  };

  // Modal Asesor Olfativo
  readonly isAdvisorOpen = signal(false);
  advisorOccasion = 'Noche & Gala';
  advisorFamily = 'Amaderado';
  advisorConcentration = 'EDP';

  // Modal Detalle de Perfume
  readonly isDetailOpen = signal(false);
  readonly detailLoading = signal(false);
  readonly selectedProduct = signal<any>(null);
  readonly activeImage = signal('');
  readonly selectedVariant = signal<any>(null);
  readonly reviews = signal<any[]>([]);
  readonly reviewLoading = signal(false);
  readonly reviewMessage = signal('');

  newReview = {
    userName: '',
    rating: 5,
    comment: '',
    photoUrl: '',
  };

  private initialized = false;
  private lastNavVersion = -1;

  constructor() {
    effect(() => {
      const version = this.catalogFilter.navVersion();
      if (!this.initialized || version === this.lastNavVersion) {
        return;
      }
      this.lastNavVersion = version;
      this.syncFromNavService();
    });
  }

  ngOnInit(): void {
    this.initialized = true;
    this.lastNavVersion = this.catalogFilter.navVersion();
    this.loadFilterOptions();
    this.syncFromNavService();

    // Si viene desde el Inicio seleccionando un perfume o el asesor olfativo
    const qp = this.route.snapshot.queryParamMap;
    const productoSlug = qp.get('producto');
    if (productoSlug) {
      this.openDetailBySlug(productoSlug);
    }
    if (qp.get('asesor') === '1') {
      this.isAdvisorOpen.set(true);
    }
  }

  goHome(): void {
    this.catalogFilter.resetAll();
    this.router.navigate(['/']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get currentHero(): CollectionHeroMeta {
    return COLLECTION_HERO[this.catalogFilter.activeTab()] ?? COLLECTION_HERO.all;
  }

  private syncFromNavService(): void {
    const tab = this.catalogFilter.activeTab();
    const navBrand = this.catalogFilter.selectedBrandFromNav();
    const navSearch = this.catalogFilter.searchQuery();

    this.q = navSearch;
    this.clearFilterStateOnly();

    switch (tab) {
      case 'hombre':
        this.selectedGender = 'Hombre';
        break;
      case 'mujer':
        this.selectedGender = 'Mujer';
        break;
      case 'nicho':
        if (navBrand) {
          this.selectedMarcas = [navBrand];
        } else {
          this.onlyNiche = true;
        }
        break;
      case 'ocasiones':
        this.selectedOcasiones = ['Noche & Gala', 'Citas Románticas'];
        break;
      case 'decants':
        this.selectedFormatos = ['Decant 5ml / 10ml', 'Discovery Set'];
        this.sectionsOpen['formato'] = true;
        break;
      case 'promociones':
        this.soloDescuento = true;
        break;
      case 'favoritos':
        this.onlyFavorites = true;
        break;
      case 'all':
      default:
        break;
    }

    this.applyFilters(0);
  }

  private clearFilterStateOnly(): void {
    this.selectedGender = null;
    this.onlyNiche = false;
    this.selectedFamilias = [];
    this.selectedConcentraciones = [];
    this.selectedOcasiones = [];
    this.selectedFormatos = [];
    this.selectedMarcas = [];
    this.soloDescuento = false;
    this.entrega24h = false;
    this.onlyFavorites = false;
    this.minPrecio = null;
    this.maxPrecio = null;
    this.priceSliderValue = this.dbMaxPrice;
  }

  loadFilterOptions(): void {
    this.productService.getFilterOptions().subscribe({
      next: (opts) => {
        if (opts.familias?.length) this.availableFamilias.set(opts.familias);
        if (opts.concentraciones?.length) {
          const preferredOrder = ['EDP', 'Extrait', 'EDT', 'Elixir'];
          const sorted = [...opts.concentraciones].sort((a, b) => {
            const ia = preferredOrder.indexOf(a);
            const ib = preferredOrder.indexOf(b);
            return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
          });
          this.availableConcentraciones.set(sorted);
        }
        if (opts.ocasiones?.length) this.availableOcasiones.set(opts.ocasiones);
        if (opts.formatos?.length) this.availableFormatos.set(opts.formatos);
        if (opts.marcas?.length) this.availableMarcas.set(opts.marcas);
        if (opts.minPrice != null) this.dbMinPrice = Math.floor(Number(opts.minPrice));
        if (opts.maxPrice != null) {
          this.dbMaxPrice = Math.ceil(Number(opts.maxPrice) / 50) * 50;
          if (this.maxPrecio == null) {
            this.priceSliderValue = this.dbMaxPrice;
          }
        }
      },
      error: () => {
        // fallback defaults already set
      },
    });
  }

  applyFilters(page = 0): void {
    this.page = page;
    this.loading.set(true);
    this.error.set('');

    const params: Record<string, any> = {
      page: this.onlyFavorites ? 0 : this.page,
      size: this.onlyFavorites ? 50 : this.pageSize,
    };

    if (this.q.trim()) params['q'] = this.q.trim();
    if (this.selectedGender) params['genero'] = this.selectedGender;
    if (this.onlyNiche) params['nicho'] = true;
    if (this.selectedFamilias.length > 0) params['familia'] = this.selectedFamilias.join(',');
    if (this.selectedConcentraciones.length > 0) {
      params['concentracion'] = this.selectedConcentraciones.join(',');
    }
    if (this.selectedOcasiones.length > 0) params['ocasion'] = this.selectedOcasiones.join(',');
    if (this.selectedFormatos.length > 0) params['formato'] = this.selectedFormatos.join(',');
    if (this.selectedMarcas.length > 0) params['marca'] = this.selectedMarcas.join(',');
    if (this.soloDescuento) params['soloDescuento'] = true;
    if (this.entrega24h) params['entrega24h'] = true;
    if (this.minPrecio != null && this.minPrecio !== ('' as any)) params['minPrecio'] = this.minPrecio;
    if (this.maxPrecio != null && this.maxPrecio !== ('' as any)) params['maxPrecio'] = this.maxPrecio;
    if (this.sort) params['sort'] = this.sort;

    this.productService.getPaged(params).subscribe({
      next: (res) => {
        let items: Product[] = res.content ?? [];
        if (this.onlyFavorites) {
          const favIds = this.catalogFilter.wishlistIds();
          items = items.filter((p) => favIds.includes(p.id));
          this.products.set(items);
          this.totalElements = items.length;
          this.totalPages = 1;
        } else {
          this.products.set(items);
          this.totalPages = Math.max(1, res.totalPages ?? 1);
          this.totalElements = res.totalElements ?? items.length;
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo de perfumería. Verifica que el servidor esté activo.');
        this.loading.set(false);
      },
    });
  }

  // --- Interacciones de Filtros ---
  onPriceSliderChange(val: number): void {
    this.priceSliderValue = Number(val);
    this.maxPrecio = this.priceSliderValue >= this.dbMaxPrice ? null : this.priceSliderValue;
    this.applyFilters(0);
  }

  onPriceInputsApply(): void {
    if (this.maxPrecio != null && this.maxPrecio > 0) {
      this.priceSliderValue = Math.min(this.dbMaxPrice, this.maxPrecio);
    } else {
      this.priceSliderValue = this.dbMaxPrice;
    }
    this.applyFilters(0);
  }

  getSliderPercent(): number {
    if (this.dbMaxPrice <= 0) return 100;
    return Math.min(100, Math.max(0, (this.priceSliderValue / this.dbMaxPrice) * 100));
  }

  toggleItem(list: string[], value: string): void {
    const idx = list.indexOf(value);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(value);
    }
    this.applyFilters(0);
  }

  toggleSoloDescuento(): void {
    this.soloDescuento = !this.soloDescuento;
    this.applyFilters(0);
  }

  toggleEntrega24h(): void {
    this.entrega24h = !this.entrega24h;
    this.applyFilters(0);
  }

  clearGender(): void {
    this.selectedGender = null;
    if (this.catalogFilter.activeTab() === 'hombre' || this.catalogFilter.activeTab() === 'mujer') {
      this.catalogFilter.syncActiveTabSilently('all');
    }
    this.applyFilters(0);
  }

  clearNiche(): void {
    this.onlyNiche = false;
    if (this.catalogFilter.activeTab() === 'nicho') {
      this.catalogFilter.syncActiveTabSilently('all');
    }
    this.applyFilters(0);
  }

  clearFavoritesFilter(): void {
    this.onlyFavorites = false;
    this.catalogFilter.syncActiveTabSilently('all');
    this.applyFilters(0);
  }

  clearSearch(): void {
    this.q = '';
    this.catalogFilter.syncSearchQuerySilently('');
    this.applyFilters(0);
  }

  clearPrice(): void {
    this.minPrecio = null;
    this.maxPrecio = null;
    this.priceSliderValue = this.dbMaxPrice;
    this.applyFilters(0);
  }

  resetFilters(): void {
    this.q = '';
    this.clearFilterStateOnly();
    this.sort = 'bestsellers';
    this.catalogFilter.syncSearchQuerySilently('');
    this.catalogFilter.syncActiveTabSilently('all');
    this.applyFilters(0);
  }

  getActiveFiltersCount(): number {
    let count = 0;
    if (this.q.trim()) count++;
    if (this.selectedGender) count++;
    if (this.onlyNiche) count++;
    if (this.onlyFavorites) count++;
    count += this.selectedFamilias.length;
    count += this.selectedConcentraciones.length;
    count += this.selectedOcasiones.length;
    count += this.selectedFormatos.length;
    count += this.selectedMarcas.length;
    if (this.soloDescuento) count++;
    if (this.entrega24h) count++;
    if (this.minPrecio != null || this.maxPrecio != null) count++;
    return count;
  }

  toggleSection(section: string): void {
    this.sectionsOpen[section] = !this.sectionsOpen[section];
  }

  toggleMobileDrawer(): void {
    this.isMobileFilterOpen = !this.isMobileFilterOpen;
  }

  getPageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i);
  }

  getDisplayRangeText(): string {
    if (this.totalElements === 0) return '0 fragancias';
    const start = this.page * this.pageSize + 1;
    const end = Math.min(this.totalElements, start + this.products().length - 1);
    return `Mostrando ${start} – ${end} de ${this.totalElements} fragancias exclusivas`;
  }

  // --- Wishlist & Carrito ---
  toggleFavorite(productId: number, event: Event): void {
    event.stopPropagation();
    this.catalogFilter.toggleWishlist(productId);
    if (this.onlyFavorites) {
      this.applyFilters(0);
    }
  }

  addToCart(product: Product, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.cart.add(product);
    this.showToast(`"${product.name}" agregado a tu bolsa`);
  }

  addSampleToCart(product: Product, event: Event): void {
    event.stopPropagation();
    const samplePrice = product.samplePrice ?? Math.max(35, Math.round(product.price * 0.06));
    const sampleItem: Product = {
      ...product,
      name: `${product.name} — Muestra Oficial 5ml`,
      price: samplePrice,
    };
    this.cart.add(sampleItem);
    this.showToast(`Muestra 5ml de "${product.name}" (S/. ${samplePrice}) agregada`);
  }

  private showToast(msg: string): void {
    this.addedMessage.set(msg);
    setTimeout(() => this.addedMessage.set(''), 2800);
  }

  // --- Asesor Olfativo ---
  openAdvisor(): void {
    this.isAdvisorOpen.set(true);
  }

  closeAdvisor(): void {
    this.isAdvisorOpen.set(false);
  }

  applyAdvisorRecommendation(): void {
    this.clearFilterStateOnly();
    this.q = '';
    this.catalogFilter.syncSearchQuerySilently('');
    this.catalogFilter.syncActiveTabSilently('ocasiones');
    this.selectedOcasiones = [this.advisorOccasion];
    this.selectedFamilias = [this.advisorFamily];
    if (this.advisorConcentration !== 'Cualquiera') {
      this.selectedConcentraciones = [this.advisorConcentration];
    }
    this.isAdvisorOpen.set(false);
    this.applyFilters(0);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  }

  goToDiscoverySets(): void {
    this.catalogFilter.selectCollection('decants');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Modal de Detalle ---
  openDetail(product: Product): void {
    const slugOrId = product.slug || String(product.id);
    this.openDetailBySlug(slugOrId, product);
  }

  openDetailBySlug(slugOrId: string, fallbackProduct?: Product): void {
    this.isDetailOpen.set(true);
    this.detailLoading.set(true);
    this.selectedProduct.set(null);
    this.selectedVariant.set(null);
    this.reviews.set([]);
    this.reviewMessage.set('');

    this.productService.getBySlug(slugOrId).subscribe({
      next: (detail) => {
        this.selectedProduct.set(detail);
        this.activeImage.set(detail.imageUrl);
        if (detail.variantes && detail.variantes.length > 0) {
          this.selectedVariant.set(detail.variantes[0]);
        }
        this.detailLoading.set(false);
        this.loadReviews(detail.id);
      },
      error: () => {
        this.detailLoading.set(false);
        if (fallbackProduct) {
          this.selectedProduct.set(fallbackProduct);
          this.activeImage.set(fallbackProduct.imageUrl ?? '');
        } else {
          this.isDetailOpen.set(false);
        }
      },
    });
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.selectedProduct.set(null);
    if (this.route.snapshot.queryParamMap.has('producto')) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { producto: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  selectImage(url: string): void {
    this.activeImage.set(url);
  }

  selectVariant(variant: any): void {
    this.selectedVariant.set(variant);
  }

  loadReviews(productId: number): void {
    this.reviewLoading.set(true);
    this.productService.getReviews(productId).subscribe({
      next: (revs) => {
        this.reviews.set(revs);
        this.reviewLoading.set(false);
      },
      error: () => {
        this.reviewLoading.set(false);
      },
    });
  }

  submitReview(): void {
    const prod = this.selectedProduct();
    if (!prod || !this.newReview.userName.trim() || !this.newReview.comment.trim()) {
      return;
    }

    const payload = {
      userName: this.newReview.userName.trim(),
      rating: this.newReview.rating,
      comment: this.newReview.comment.trim(),
      photos: this.newReview.photoUrl.trim() ? [this.newReview.photoUrl.trim()] : [],
    };

    this.productService.addReview(prod.id, payload).subscribe({
      next: () => {
        this.reviewMessage.set('¡Gracias! Tu reseña olfativa ha sido publicada.');
        this.newReview = { userName: '', rating: 5, comment: '', photoUrl: '' };
        this.loadReviews(prod.id);
        setTimeout(() => this.reviewMessage.set(''), 3000);
      },
      error: () => {
        this.reviewMessage.set('No se pudo publicar la reseña. Inténtalo nuevamente.');
      },
    });
  }

  addToCartFromDetail(): void {
    const prod = this.selectedProduct();
    if (!prod) return;
    const variant = this.selectedVariant();
    const variantLabel = variant?.attributes?.length
      ? variant.attributes.map((a: any) => a.value).join(' · ')
      : variant?.sku;
    const item: Product = {
      id: prod.id,
      name: variantLabel ? `${prod.name} (${variantLabel})` : prod.name,
      description: prod.description,
      price: variant?.price || prod.price,
      stock: variant ? variant.stock : prod.stock,
      imageUrl: this.activeImage() || prod.imageUrl,
    };
    this.addToCart(item);
  }
}
