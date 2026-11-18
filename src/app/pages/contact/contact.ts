import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  imports: [FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class Contact {
  readonly nombre = signal('');
  readonly email = signal('');
  readonly mensaje = signal('');
  readonly sent = signal(false);

  enviarMensaje(): void {
    if (!this.nombre() || !this.email() || !this.mensaje()) return;
    this.sent.set(true);
    this.nombre.set('');
    this.email.set('');
    this.mensaje.set('');
  }
}
