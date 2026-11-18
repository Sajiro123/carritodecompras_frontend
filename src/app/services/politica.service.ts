import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { Politica } from '../models/politica';

@Injectable({ providedIn: 'root' })
export class PoliticaService {
  private readonly http = inject(HttpClient);

  getBySlug(slug: string): Observable<Politica> {
    return this.http.get<Politica>(`${API_URL}/politicas/${slug}`);
  }

  subscribeNewsletter(email: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${API_URL}/newsletter`, { email });
  }
}
