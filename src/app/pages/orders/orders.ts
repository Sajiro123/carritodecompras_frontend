import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { OrderDetail } from '../../models/order';
import { OrderService } from '../../services/order.service';

@Component({
  selector: 'app-orders',
  imports: [DecimalPipe, DatePipe, FormsModule],
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly orderService = inject(OrderService);

  readonly codigo = signal('');
  readonly telefono = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly order = signal<OrderDetail | null>(null);

  readonly steps = [
    { key: 'PENDING', label: 'Pedido Registrado', desc: 'Recibido en nuestro sistema' },
    { key: 'PAID', label: 'Pago Confirmado', desc: 'Validado por nuestro equipo' },
    { key: 'PREPARING', label: 'En Preparación', desc: 'Empacando tus productos' },
    { key: 'SHIPPED', label: 'En Camino / Agencia', desc: 'Despachado a courier o Shalom' },
    { key: 'DELIVERED', label: 'Entregado', desc: 'Entregado con éxito' },
  ];

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const cod = params.get('codigo');
      const tel = params.get('telefono');
      if (cod && tel) {
        this.codigo.set(cod);
        this.telefono.set(tel);
        this.consultar();
      }
    });
  }

  consultar(): void {
    const cod = this.codigo().trim();
    const tel = this.telefono().trim();

    if (!cod || !tel) {
      this.error.set('Por favor ingresa tanto el Código de Pedido como tu Número de Celular.');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.order.set(null);

    this.orderService.getSeguimiento(cod, tel).subscribe({
      next: (data) => {
        this.order.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(
          err.error?.message ||
            'No encontramos ningún pedido con los datos ingresados. Verifica el código y tu número de teléfono.',
        );
      },
    });
  }

  isStepCompleted(stepKey: string, currentStatus: string): boolean {
    const orderIndex = this.steps.findIndex((s) => s.key === currentStatus);
    const stepIndex = this.steps.findIndex((s) => s.key === stepKey);
    return stepIndex <= (orderIndex >= 0 ? orderIndex : 0);
  }

  isStepActive(stepKey: string, currentStatus: string): boolean {
    return stepKey === currentStatus;
  }
}
