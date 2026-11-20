import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { Product } from '../../models/product';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { CatalogFilterService, CollectionMenuKey } from '../../services/catalog-filter.service';

type DealFilterTab = 'todos' | 'nicho' | 'disenador' | 'decants' | 'sets';

interface HeroSlide {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  targetCollection: CollectionMenuKey;
  imageUrl: string;
}

@Component({
  selector: 'app-home',
  imports: [DecimalPipe],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly cart = inject(CartService);
  private readonly catalogFilter = inject(CatalogFilterService);
  private readonly router = inject(Router);

  readonly allProducts = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly activeDealTab = signal<DealFilterTab>('todos');
  readonly activeSlide = signal(0);

  // Countdown en vivo para la promoción de lote
  readonly countdownHours = signal('14');
  readonly countdownMinutes = signal('32');
  readonly countdownSeconds = signal('05');
  private remainingSeconds = 14 * 3600 + 32 * 60 + 5;
  private countdownInterval: ReturnType<typeof setInterval> | null = null;
  private sliderInterval: ReturnType<typeof setInterval> | null = null;
  private sliderPaused = false;

  readonly heroSlides: HeroSlide[] = [
    {
      eyebrow: 'CORTESÍA DE AUTOR',
      title: 'Discovery Set de Regalo',
      subtitle:
        'En todos los pedidos superiores a S/. 350. Experimenta extractos puros de Parfums de Marly y Nishane sin costo adicional.',
      ctaLabel: 'APROVECHAR OBSEQUIO',
      targetCollection: 'decants',
      imageUrl: 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=1600&q=85',
    },
    {
      eyebrow: 'ALTA PERFUMERÍA INDEPENDIENTE',
      title: 'Universo Nicho — Colección 2026',
      subtitle:
        'Creed, Xerjoff, Initio Privés y Maison Francis Kurkdjian en frascos originales sellados con lotes verificados en Lima.',
      ctaLabel: 'EXPLORAR CASAS NICHO',
      targetCollection: 'nicho',
      imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=1600&q=85',
    },
    {
      eyebrow: 'GALA & VELADAS NOCTURNAS',
      title: 'Fragancias de Máxima Estela',
      subtitle:
        'Extractos puros y elixires de alta maceración diseñados para destacar en galas de etiqueta y citas memorables.',
      ctaLabel: 'VER OCASIONES ESPECIALES',
      targetCollection: 'ocasiones',
      imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1600&q=85',
    },
  ];

  readonly dealTabs: { key: DealFilterTab; label: string }[] = [
    { key: 'todos', label: 'TODOS LOS DESCUENTOS' },
    { key: 'nicho', label: 'NICHO (-15%)' },
    { key: 'disenador', label: 'DISEÑADOR (-20%)' },
    { key: 'decants', label: 'DECANTS EN OFERTA' },
    { key: 'sets', label: 'SETS DE REGALO' },
  ];

  readonly featuredProducts = computed(() => {
    const items = this.allProducts();
    const tab = this.activeDealTab();
    if (!items.length) return [];

    let filtered: Product[];
    switch (tab) {
      case 'nicho':
        filtered = items.filter((p) => p.isNiche);
        break;
      case 'disenador':
        filtered = items.filter(
          (p) => !p.isNiche || (p.brand || '').toLowerCase().includes('tom ford')
        );
        break;
      case 'decants':
        filtered = items.filter(
          (p) =>
            (p.formatType || '').toLowerCase().includes('decant') ||
            (p.samplePrice != null && p.samplePrice > 0)
        );
        break;
      case 'sets':
        filtered = items.filter(
          (p) =>
            (p.formatType || '').toLowerCase().includes('set') ||
            (p.badge || '').toLowerCase().includes('set') ||
            (p.originalPrice != null && p.originalPrice > p.price)
        );
        break;
      case 'todos':
      default: {
        // Priorizar íconos y productos con oferta destacada
        const withDiscount = items.filter((p) => p.originalPrice && p.originalPrice > p.price);
        const iconic = items.filter((p) => !(p.originalPrice && p.originalPrice > p.price));
        filtered = [...withDiscount, ...iconic];
        break;
      }
    }

    return filtered.slice(0, 6);
  });

  ngOnInit(): void {
    this.loadFeaturedProducts();
    this.startCountdown();
    this.startSlider();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.sliderInterval) clearInterval(this.sliderInterval);
  }

  private loadFeaturedProducts(): void {
    this.loading.set(true);
    this.productService.getPaged({ page: 0, size: 20, sort: 'bestsellers' }).subscribe({
      next: (res) => {
        this.allProducts.set(res.content ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  private startCountdown(): void {
    this.updateCountdownDisplay();
    this.countdownInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
      } else {
        this.remainingSeconds = 14 * 3600 + 32 * 60 + 5;
      }
      this.updateCountdownDisplay();
    }, 1000);
  }

  private updateCountdownDisplay(): void {
    const h = Math.floor(this.remainingSeconds / 3600);
    const m = Math.floor((this.remainingSeconds % 3600) / 60);
    const s = this.remainingSeconds % 60;
    this.countdownHours.set(String(h).padStart(2, '0'));
    this.countdownMinutes.set(String(m).padStart(2, '0'));
    this.countdownSeconds.set(String(s).padStart(2, '0'));
  }

  private startSlider(): void {
    this.sliderInterval = setInterval(() => {
      if (!this.sliderPaused) {
        this.nextSlide();
      }
    }, 6500);
  }

  setSliderPaused(paused: boolean): void {
    this.sliderPaused = paused;
  }

  nextSlide(): void {
    this.activeSlide.update((idx) => (idx + 1) % this.heroSlides.length);
  }

  prevSlide(): void {
    this.activeSlide.update((idx) => (idx - 1 + this.heroSlides.length) % this.heroSlides.length);
  }

  goToSlide(index: number): void {
    this.activeSlide.set(index);
  }

  selectDealTab(tab: DealFilterTab): void {
    this.activeDealTab.set(tab);
  }

  // --- Navegación hacia la página de productos (/catalogo) ---
  goToCollection(tab: CollectionMenuKey): void {
    this.catalogFilter.selectCollection(tab);
    this.router.navigate(['/catalogo']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openProductInCatalog(product: Product): void {
    this.catalogFilter.syncActiveTabSilently('all');
    this.catalogFilter.syncSearchQuerySilently('');
    this.router.navigate(['/catalogo'], {
      queryParams: { producto: product.slug || product.id },
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  buyAndGoToCatalog(product: Product, event: Event): void {
    event.stopPropagation();
    this.cart.add(product);
    this.catalogFilter.syncActiveTabSilently('all');
    this.router.navigate(['/catalogo']);
  }

  buyDecantAndGoToCatalog(product: Product, event: Event): void {
    event.stopPropagation();
    const samplePrice = product.samplePrice ?? Math.max(35, Math.round(product.price * 0.06));
    const sampleItem: Product = {
      ...product,
      name: `${product.name} — Decant Oficial 5ml`,
      price: samplePrice,
    };
    this.cart.add(sampleItem);
    this.catalogFilter.syncActiveTabSilently('decants');
    this.router.navigate(['/catalogo']);
  }

  openAdvisorInCatalog(): void {
    this.catalogFilter.syncActiveTabSilently('all');
    this.router.navigate(['/catalogo'], { queryParams: { asesor: '1' } });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Helpers de presentación de tarjetas ---
  getDiscountBadge(p: Product): { text: string; tone: 'red' | 'gold' | 'dark' } {
    if (p.originalPrice && p.originalPrice > p.price) {
      const pct = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
      return { text: `-${pct}% OFF`, tone: 'red' };
    }
    if (p.badge) {
      const tone = p.badgeTone === 'red' ? 'red' : p.badgeTone === 'gold' ? 'gold' : 'dark';
      return { text: p.badge, tone };
    }
    return { text: 'LIQUIDACIÓN', tone: 'gold' };
  }

  getConcentrationLabel(p: Product): string {
    switch ((p.concentration || '').toUpperCase()) {
      case 'EXTRAIT':
        return 'EXTRAIT DE PARFUM';
      case 'ELIXIR':
        return 'ELIXIR CONCENTRÉ';
      case 'EDT':
        return 'EAU DE TOILETTE';
      default:
        return p.isNiche ? 'PRIVATE BLEND' : 'EAU DE PARFUM';
    }
  }

  getSavingsAmount(p: Product): number {
    if (p.originalPrice && p.originalPrice > p.price) {
      return p.originalPrice - p.price;
    }
    return 0;
  }

  getShortNotes(p: Product): string[] {
    if (!p.notes) return [];
    return p.notes
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
      .slice(0, 3);
  }
}
