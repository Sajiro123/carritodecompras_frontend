import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { BRAND_CONFIG } from '../../core/brand.config';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-store-layout',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './store-layout.html',
  styleUrl: './store-layout.scss',
})
export class StoreLayout {
  readonly brand = BRAND_CONFIG;
  readonly cart = inject(CartService);
}
