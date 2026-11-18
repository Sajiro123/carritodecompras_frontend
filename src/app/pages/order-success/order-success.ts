import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderDetail } from '../../models/order';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-success',
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './order-success.html',
  styleUrl: './order-success.scss',
})
export class OrderSuccess implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  readonly order = signal<OrderDetail | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('Pedido inválido');
      return;
    }

    this.orderService.getById(id).subscribe({
      next: (data) => this.order.set(data),
      error: () => this.error.set('No se pudo cargar el detalle del pedido'),
    });
  }
}
