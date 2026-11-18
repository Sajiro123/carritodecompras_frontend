import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { EnvioService } from '../../services/envio.service';
import { Ubigeo } from '../../models/ubigeo';
import { AgenciaEnvio, CalculoEnvio, Tienda } from '../../models/envio';
import { CreateOrderPayload } from '../../models/order';

@Component({
  selector: 'app-checkout',
  imports: [ReactiveFormsModule, DecimalPipe, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly orderService = inject(OrderService);
  private readonly envioService = inject(EnvioService);
  private readonly router = inject(Router);
  readonly cart = inject(CartService);

  readonly sending = signal(false);
  readonly error = signal('');

  // Estados de datos
  readonly ubigeoQuery = signal('');
  readonly ubigeosList = signal<Ubigeo[]>([]);
  readonly selectedUbigeo = signal<Ubigeo | null>(null);
  readonly showUbigeoDropdown = signal(false);

  readonly tiendas = signal<Tienda[]>([]);
  readonly agencias = signal<AgenciaEnvio[]>([]);
  readonly calculoEnvio = signal<CalculoEnvio | null>(null);

  // Tipo de entrega actual
  readonly deliveryType = signal<'DOMICILIO' | 'SHALOM' | 'TIENDA'>('DOMICILIO');
  // Tipo de comprobante actual
  readonly receiptType = signal<'BOLETA' | 'FACTURA'>('BOLETA');
  // Método de pago actual
  readonly paymentMethod = signal<'BCP' | 'YAPE_PLIN' | 'CULQI' | 'FLOW'>('BCP');

  // Formulario reactivo
  readonly form = this.fb.nonNullable.group({
    // Sección 1: Contacto
    contactoNombre: ['', [Validators.required, Validators.minLength(3)]],
    contactoTelefono: ['', [Validators.required, Validators.pattern(/^[0-9]{9}$/)]],
    contactoEmail: ['', [Validators.required, Validators.email]],

    // Sección 2: Entrega a Domicilio
    direccion: [''],
    referencia: [''],
    ubigeoCodigo: [''],

    // Sección 2: Entrega en Agencia Shalom
    agenciaId: [1],
    receptorNombre: [''],
    receptorDni: ['', [Validators.pattern(/^[0-9]{8}$/)]],

    // Sección 2: Recojo en Tienda
    tiendaId: [1],

    // Sección 3: Comprobante
    usarMismosDatosBoleta: [true],
    tipoDocumento: ['DNI'],
    numeroDocumento: [''],
    razonSocial: [''],
    direccionFiscal: [''],
  });

  // Costo de envío reactivo
  readonly shippingCost = computed(() => {
    const type = this.deliveryType();
    if (type === 'TIENDA') return 0;
    if (this.cart.hasFreeShipping()) return 0;
    if (type === 'SHALOM') return 15.0;

    const calc = this.calculoEnvio();
    return calc ? calc.costoEnvio : 10.0; // Tarifa por defecto para Lima
  });

  // Total final reactivo
  readonly grandTotal = computed(() => {
    return this.cart.subtotal() + this.shippingCost();
  });

  ngOnInit(): void {
    // Si el carrito está vacío, regresar a la tienda
    if (this.cart.items().length === 0) {
      this.router.navigate(['/cart']);
      return;
    }

    // Cargar tiendas físicas
    this.envioService.getTiendas().subscribe({
      next: (list) => {
        this.tiendas.set(list);
        if (list.length > 0) {
          this.form.patchValue({ tiendaId: list[0].id });
        }
      },
    });

    // Cargar agencias Shalom
    this.envioService.getAgencias().subscribe({
      next: (list) => {
        this.agencias.set(list);
        if (list.length > 0) {
          this.form.patchValue({ agenciaId: list[0].id });
        }
      },
    });

    // Cargar cálculo de envío inicial (por defecto Lima)
    this.recalcularEnvio('150101');
  }

  setDeliveryType(type: 'DOMICILIO' | 'SHALOM' | 'TIENDA'): void {
    this.deliveryType.set(type);
    if (type === 'DOMICILIO' && this.selectedUbigeo()) {
      this.recalcularEnvio(this.selectedUbigeo()!.codigo);
    }
  }

  setReceiptType(type: 'BOLETA' | 'FACTURA'): void {
    this.receiptType.set(type);
    if (type === 'FACTURA') {
      this.form.controls.numeroDocumento.setValidators([
        Validators.required,
        Validators.pattern(/^[0-9]{11}$/),
      ]);
      this.form.controls.razonSocial.setValidators([Validators.required]);
    } else {
      this.form.controls.numeroDocumento.setValidators([
        Validators.required,
        Validators.pattern(/^[0-9]{8,12}$/),
      ]);
      this.form.controls.razonSocial.clearValidators();
    }
    this.form.controls.numeroDocumento.updateValueAndValidity();
    this.form.controls.razonSocial.updateValueAndValidity();
  }

  setPaymentMethod(method: 'BCP' | 'YAPE_PLIN' | 'CULQI' | 'FLOW'): void {
    this.paymentMethod.set(method);
  }

  onSearchUbigeo(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.ubigeoQuery.set(val);

    if (val.trim().length >= 2) {
      this.envioService.searchUbigeos(val).subscribe({
        next: (res) => {
          this.ubigeosList.set(res);
          this.showUbigeoDropdown.set(true);
        },
      });
    } else {
      this.ubigeosList.set([]);
      this.showUbigeoDropdown.set(false);
    }
  }

  selectUbigeo(u: Ubigeo): void {
    this.selectedUbigeo.set(u);
    this.ubigeoQuery.set(u.label);
    this.form.patchValue({ ubigeoCodigo: u.codigo });
    this.showUbigeoDropdown.set(false);
    this.recalcularEnvio(u.codigo);
  }

  private recalcularEnvio(ubigeoCodigo: string): void {
    this.envioService.calcularEnvio(ubigeoCodigo, this.cart.subtotal()).subscribe({
      next: (calc) => {
        this.calculoEnvio.set(calc);
      },
    });
  }

  submitOrder(): void {
    this.error.set('');

    // Validar carrito
    if (this.cart.items().length === 0) {
      this.error.set('Tu carrito está vacío');
      return;
    }

    // Validar contacto
    const { contactoNombre, contactoTelefono, contactoEmail } = this.form.getRawValue();
    if (!contactoNombre || !contactoTelefono || !contactoEmail) {
      this.error.set('Por favor completa todos los datos obligatorios de Contacto.');
      return;
    }
    if (contactoTelefono.length !== 9) {
      this.error.set('El teléfono debe tener exactamente 9 dígitos (+51).');
      return;
    }

    // Validar entrega
    const type = this.deliveryType();
    if (type === 'DOMICILIO') {
      if (!this.form.controls.direccion.value) {
        this.error.set('Por favor ingresa la dirección de entrega a domicilio.');
        return;
      }
      if (!this.form.controls.ubigeoCodigo.value) {
        this.error.set('Por favor selecciona tu distrito / ubigeo de la lista.');
        return;
      }
    } else if (type === 'SHALOM') {
      const recNombre = this.form.controls.receptorNombre.value || contactoNombre;
      const recDni = this.form.controls.receptorDni.value;
      if (!recDni || recDni.length !== 8) {
        this.error.set('Por favor ingresa un DNI válido de 8 dígitos para el recojo en Shalom.');
        return;
      }
    }

    // Validar comprobante
    const rType = this.receiptType();
    let docType = this.form.controls.tipoDocumento.value;
    let docNum = this.form.controls.numeroDocumento.value;

    if (rType === 'FACTURA') {
      docType = 'RUC';
      if (!docNum || docNum.length !== 11) {
        this.error.set('Para factura, el RUC debe tener exactamente 11 dígitos numéricos.');
        return;
      }
      if (!this.form.controls.razonSocial.value) {
        this.error.set('Por favor ingresa la Razón Social para la factura.');
        return;
      }
    } else {
      // Boleta
      if (this.form.controls.usarMismosDatosBoleta.value && !docNum) {
        docNum = '45678901'; // Default referencial si usa mismos datos
      } else if (!docNum) {
        this.error.set('Por favor ingresa el número de documento para la boleta.');
        return;
      }
    }

    this.sending.set(true);

    const payload: CreateOrderPayload = {
      contacto: {
        nombre: contactoNombre.trim(),
        telefono: contactoTelefono.trim(),
        email: contactoEmail.trim(),
      },
      entrega: {
        tipo: type,
        ubigeoCodigo: type === 'DOMICILIO' ? this.form.controls.ubigeoCodigo.value : null,
        direccion: type === 'DOMICILIO' ? this.form.controls.direccion.value.trim() : null,
        referencia: type === 'DOMICILIO' ? this.form.controls.referencia.value?.trim() || null : null,
        tiendaId: type === 'TIENDA' ? Number(this.form.controls.tiendaId.value) : null,
        agenciaId: type === 'SHALOM' ? Number(this.form.controls.agenciaId.value) : null,
        receptorNombre: type === 'SHALOM' ? (this.form.controls.receptorNombre.value.trim() || contactoNombre) : null,
        receptorDni: type === 'SHALOM' ? this.form.controls.receptorDni.value.trim() : null,
      },
      comprobante: {
        tipo: rType,
        tipoDocumento: docType,
        numeroDocumento: docNum.trim(),
        razonSocial: rType === 'FACTURA' ? this.form.controls.razonSocial.value?.trim() || null : null,
        direccionFiscal: rType === 'FACTURA' ? this.form.controls.direccionFiscal.value?.trim() || null : null,
      },
      pago: {
        metodo: this.paymentMethod(),
      },
      items: this.cart.items().map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
      })),
    };

    this.orderService.create(payload).subscribe({
      next: (res) => {
        this.cart.clear();
        this.router.navigate(['/order-success', res.orderId]);
      },
      error: (err) => {
        this.sending.set(false);
        this.error.set(
          err.error?.message || 'Ocurrió un error al procesar tu pedido. Por favor intenta nuevamente.',
        );
      },
    });
  }
}
