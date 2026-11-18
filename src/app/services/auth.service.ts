import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

export interface AdminSession {
  email: string;
  name: string;
  role: 'ADMIN';
  tenantCode: string;
}

const SESSION_KEY = 'perfumeria_admin_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly _session = signal<AdminSession | null>(this.loadSession());

  readonly session = this._session.asReadonly();
  readonly isAuthenticated = computed(() => this._session() !== null);

  /**
   * Login estático para la demo.
   * Más adelante reemplaza esta validación por POST /api/auth/login o Supabase Auth.
   */
  login(email: string, password: string, tenantCode: string): boolean {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'admin@perfumeria.com' && password === 'Demo2026!') {
      const session: AdminSession = {
        email: cleanEmail,
        name: 'Administrador',
        role: 'ADMIN',
        tenantCode,
      };
      this._session.set(session);
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return true;
    }
    return false;
  }

  logout(): void {
    this._session.set(null);
    localStorage.removeItem(SESSION_KEY);
    this.router.navigate(['/login']);
  }

  private loadSession(): AdminSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      return raw ? (JSON.parse(raw) as AdminSession) : null;
    } catch {
      return null;
    }
  }
}
