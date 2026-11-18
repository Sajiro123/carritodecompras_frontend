import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Product } from '../../models/product';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-product-list',
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './product-list.html',
  styleUrl: './product-list.scss',
})
export class ProductList implements OnInit {
  private readonly productService = inject(ProductService);
  readonly cart = inject(CartService);

  readonly products = signal<any[]>([]);
  readonly categories = signal<any[]>([]);
  readonly availableTallas = signal<string[]>([]);
  readonly availableColores = signal<string[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly addedMessage = signal('');

  // Filtros dinámicos con soporte de multi-selección
  q = '';
  selectedCategories: string[] = [];
  selectedTallas: string[] = [];
  selectedColors: string[] = [];
  disponible: boolean | null = null;
  minPrecio: number | null = null;
  maxPrecio: number | null = null;
  sort = '';
  page = 0;
  totalPages = 1;
  totalElements = 0;

  // Rango de precios de la BD
  dbMinPrice = 0;
  dbMaxPrice = 500;

  // Estado de vista y UI
  gridDensity: 'normal' | 'compact' = 'normal';
  isMobileFilterOpen = false;

  // Secciones colapsables de filtros
  sectionsOpen: Record<string, boolean> = {
    disponibilidad: true,
    categorias: true,
    tallas: true,
    colores: true,
    precio: true,
  };

  private searchDebounceTimer: any = null;

  // Estado del Modal de Detalle con Signals
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

  ngOnInit(): void {
    this.loadFilters();
    this.applyFilters(0);
  }

  loadFilters(): void {
    this.productService.getFilterOptions().subscribe({
      next: (opts) => {
        if (opts.categories) this.categories.set(opts.categories);
        if (opts.tallas) this.availableTallas.set(opts.tallas);
        if (opts.colores) this.availableColores.set(opts.colores);
        if (opts.minPrice != null) this.dbMinPrice = opts.minPrice;
        if (opts.maxPrice != null) this.dbMaxPrice = opts.maxPrice;
      },
      error: () => {
        this.productService.getCategories().subscribe({
          next: (cats) => this.categories.set(cats),
        });
      },
    });
  }

  onSearchChange(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.applyFilters(0);
    }, 300);
  }

  applyFilters(page = 0): void {
    this.page = page;
    this.loading.set(true);
    this.error.set('');

    const params: Record<string, any> = {
      page: this.page,
      size: 12,
    };

    if (this.q.trim()) params['q'] = this.q.trim();
    if (this.selectedCategories.length > 0) {
      params['categoria'] = this.selectedCategories.join(',');
    }
    if (this.selectedTallas.length > 0) {
      params['talla'] = this.selectedTallas.join(',');
    }
    if (this.selectedColors.length > 0) {
      params['color'] = this.selectedColors.join(',');
    }
    if (this.disponible !== null) params['disponible'] = this.disponible;
    if (this.minPrecio != null && this.minPrecio !== ('' as any)) params['minPrecio'] = this.minPrecio;
    if (this.maxPrecio != null && this.maxPrecio !== ('' as any)) params['maxPrecio'] = this.maxPrecio;
    if (this.sort) params['sort'] = this.sort;

    this.productService.getPaged(params).subscribe({
      next: (res) => {
        this.products.set(res.content ?? []);
        this.totalPages = res.totalPages ?? 1;
        this.totalElements = res.totalElements ?? 0;
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo. Verifica que el backend esté en ejecución.');
        this.loading.set(false);
      },
    });
  }

  // --- Manejo de multi-selección interactiva ---
  toggleCategory(slug: string): void {
    const idx = this.selectedCategories.indexOf(slug);
    if (idx >= 0) {
      this.selectedCategories.splice(idx, 1);
    } else {
      this.selectedCategories.push(slug);
    }
    this.applyFilters(0);
  }

  isCategorySelected(slug: string): boolean {
    return this.selectedCategories.includes(slug);
  }

  toggleTalla(size: string): void {
    const idx = this.selectedTallas.indexOf(size);
    if (idx >= 0) {
      this.selectedTallas.splice(idx, 1);
    } else {
      this.selectedTallas.push(size);
    }
    this.applyFilters(0);
  }

  isTallaSelected(size: string): boolean {
    return this.selectedTallas.includes(size);
  }

  toggleColor(color: string): void {
    const idx = this.selectedColors.indexOf(color);
    if (idx >= 0) {
      this.selectedColors.splice(idx, 1);
    } else {
      this.selectedColors.push(color);
    }
    this.applyFilters(0);
  }

  isColorSelected(color: string): boolean {
    return this.selectedColors.includes(color);
  }

  toggleDisponible(val: boolean): void {
    this.disponible = this.disponible === val ? null : val;
    this.applyFilters(0);
  }

  setPricePreset(min: number | null, max: number | null): void {
    this.minPrecio = min;
    this.maxPrecio = max;
    this.applyFilters(0);
  }

  isPricePresetActive(min: number | null, max: number | null): boolean {
    return this.minPrecio === min && this.maxPrecio === max;
  }

  resetFilters(): void {
    this.q = '';
    this.selectedCategories = [];
    this.selectedTallas = [];
    this.selectedColors = [];
    this.disponible = null;
    this.minPrecio = null;
    this.maxPrecio = null;
    this.sort = '';
    this.applyFilters(0);
  }

  getActiveFiltersCount(): number {
    let count = 0;
    count += this.selectedCategories.length;
    count += this.selectedTallas.length;
    count += this.selectedColors.length;
    if (this.disponible !== null) count++;
    if (this.minPrecio != null || this.maxPrecio != null) count++;
    if (this.q.trim()) count++;
    return count;
  }

  toggleSection(section: string): void {
    this.sectionsOpen[section] = !this.sectionsOpen[section];
  }

  toggleMobileDrawer(): void {
    this.isMobileFilterOpen = !this.isMobileFilterOpen;
  }

  getColorHex(name: string): string {
    const map: Record<string, string> = {
      negro: '#18181b',
      blanco: '#ffffff',
      azul: '#2563eb',
      rojo: '#ef4444',
      gris: '#94a3b8',
      verde: '#16a34a',
    };
    return map[name.toLowerCase().trim()] || '#cbd5e1';
  }

  addToCart(product: Product, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.cart.add(product);
    this.addedMessage.set(`"${product.name}" agregado al carrito`);
    setTimeout(() => this.addedMessage.set(''), 2500);
  }

  // --- Modal de Detalle de Producto ---
  openDetail(product: any): void {
    this.isDetailOpen.set(true);
    this.detailLoading.set(true);
    this.selectedProduct.set(null);
    this.selectedVariant.set(null);
    this.reviews.set([]);
    this.reviewMessage.set('');

    const slugOrId = product.slug || product.id;
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
        this.selectedProduct.set(product);
        this.activeImage.set(product.imageUrl);
      },
    });
  }

  closeDetail(): void {
    this.isDetailOpen.set(false);
    this.selectedProduct.set(null);
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
        this.reviewMessage.set('¡Gracias! Tu reseña ha sido publicada.');
        this.newReview = { userName: '', rating: 5, comment: '', photoUrl: '' };
        this.loadReviews(prod.id);
        setTimeout(() => this.reviewMessage.set(''), 3000);
      },
      error: () => {
        alert('Error al enviar la reseña');
      },
    });
  }

  addToCartFromDetail(): void {
    const prod = this.selectedProduct();
    if (!prod) return;
    const variant = this.selectedVariant();
    const item: Product = {
      id: prod.id,
      name: variant ? `${prod.name} (${variant.sku})` : prod.name,
      description: prod.description,
      price: variant?.price || prod.price,
      stock: variant ? variant.stock : prod.stock,
      imageUrl: this.activeImage() || prod.imageUrl,
    };
    this.addToCart(item);
  }
}
