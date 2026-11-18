import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterOutlet, RouterLinkActive } from '@angular/router';
import { BRAND_CONFIG } from '../../core/brand.config';
import { CartService } from '../../services/cart.service';
import { PoliticaService } from '../../services/politica.service';
import { CartDrawer } from '../../components/cart-drawer/cart-drawer';

@Component({
  selector: 'app-store-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule, CartDrawer],
  templateUrl: './store-layout.html',
  styleUrl: './store-layout.scss',
})
export class StoreLayout {
  readonly brand = BRAND_CONFIG;
  readonly cart = inject(CartService);
  private readonly politicaService = inject(PoliticaService);

  readonly newsletterEmail = signal('');
  readonly newsletterSending = signal(false);
  readonly newsletterMessage = signal('');
  readonly newsletterSuccess = signal(false);

  openCart(event: Event): void {
    event.preventDefault();
    this.cart.openDrawer();
  }

  subscribeNewsletter(): void {
    const email = this.newsletterEmail().trim();
    if (!email || !email.includes('@')) {
      this.newsletterMessage.set('Por favor ingresa un correo electrónico válido.');
      this.newsletterSuccess.set(false);
      return;
    }

    this.newsletterSending.set(true);
    this.newsletterMessage.set('');

    this.politicaService.subscribeNewsletter(email).subscribe({
      next: (res) => {
        this.newsletterSending.set(false);
        this.newsletterSuccess.set(true);
        this.newsletterMessage.set(res.message || '¡Gracias por suscribirte!');
        this.newsletterEmail.set('');
        setTimeout(() => this.newsletterMessage.set(''), 4000);
      },
      error: () => {
        this.newsletterSending.set(false);
        this.newsletterSuccess.set(false);
        this.newsletterMessage.set('Hubo un problema al registrar tu correo. Inténtalo de nuevo.');
      },
    });
  }
}
