import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrderDetail } from '../../models/order';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-order-success',
  imports: [DecimalPipe, RouterLink],
  templateUrl: './order-success.html',
  styleUrl: './order-success.scss',
})
export class OrderSuccess implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  readonly order = signal<OrderDetail | null>(null);
  readonly error = signal('');
  readonly copied = signal(false);

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

  copyTrackingCode(code: string): void {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code).then(() => {
        this.copied.set(true);
        setTimeout(() => this.copied.set(false), 2500);
      });
    }
  }

  getWhatsAppLink(order: OrderDetail): string {
    const text = encodeURIComponent(
      `¡Hola! Acabo de realizar el pedido ${order.codigoSeguimiento} a nombre de ${order.customerName} por un total de S/ ${order.total.toFixed(2)}. Adjunto mi comprobante de pago.`,
    );
    return `https://wa.me/51987654321?text=${text}`;
  }
}
