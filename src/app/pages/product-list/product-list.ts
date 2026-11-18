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

  // Filtros estilo Nietux
  q = '';
  categoria = '';
  talla = '';
  color = '';
  disponible: boolean | null = null;
  minPrecio: number | null = null;
  maxPrecio: number | null = null;
  sort = '';
  page = 0;
  totalPages = 1;
  totalElements = 0;

  // Estado reactivo del Modal con Signals
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
      },
      error: () => {
        // Fallback a categories si filterOptions falla
        this.productService.getCategories().subscribe({
          next: (cats) => this.categories.set(cats),
        });
      },
    });
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
    if (this.categoria) params['categoria'] = this.categoria;
    if (this.talla) params['talla'] = this.talla;
    if (this.color) params['color'] = this.color;
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

  selectCategory(slug: string): void {
    this.categoria = this.categoria === slug ? '' : slug;
    this.applyFilters(0);
  }

  selectTalla(size: string): void {
    this.talla = this.talla === size ? '' : size;
    this.applyFilters(0);
  }

  selectColor(c: string): void {
    this.color = this.color === c ? '' : c;
    this.applyFilters(0);
  }

  toggleDisponible(val: boolean): void {
    this.disponible = this.disponible === val ? null : val;
    this.applyFilters(0);
  }

  resetFilters(): void {
    this.q = '';
    this.categoria = '';
    this.talla = '';
    this.color = '';
    this.disponible = null;
    this.minPrecio = null;
    this.maxPrecio = null;
    this.sort = '';
    this.applyFilters(0);
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
