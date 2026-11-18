import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, CurrencyPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly router = inject(Router);
  readonly cart = inject(CartService);

  readonly sending = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    address: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid || this.cart.items().length === 0) return;
    this.sending.set(true);
    this.error.set('');

    this.orderService
      .create({
        customer: this.form.getRawValue(),
        items: this.cart.items().map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      })
      .subscribe({
        next: (res) => {
          this.cart.clear();
          this.router.navigate(['/order-success', res.orderId]);
        },
        error: (err) => {
          this.error.set(err.error?.message ?? 'Error al crear el pedido');
          this.sending.set(false);
        },
      });
  }
}
