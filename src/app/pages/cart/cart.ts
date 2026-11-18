import { Component, inject } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart',
  imports: [DecimalPipe, RouterLink, FormsModule],
  templateUrl: './cart.html',
  styleUrl: './cart.scss',
})
export class Cart {
  readonly cart = inject(CartService);

  onQuantityInputChange(productId: number, event: Event, maxStock: number): void {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1) {
      val = 1;
    } else if (val > maxStock) {
      val = maxStock;
    }
    input.value = val.toString();
    this.cart.setQuantity(productId, val);
  }
}
