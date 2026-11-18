import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BRAND_CONFIG } from '../../core/brand.config';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly brand = BRAND_CONFIG;
  readonly showPassword = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, password } = this.form.getRawValue();
    const ok = this.auth.login(email, password, this.brand.tenantCode);
    if (!ok) {
      this.error.set('Correo o contraseña incorrectos.');
      return;
    }

    this.router.navigate(['/admin']);
  }

  fillDemo(): void {
    this.form.setValue({
      email: 'admin@perfumeria.com',
      password: 'Demo2026!',
    });
    this.error.set('');
  }
}
