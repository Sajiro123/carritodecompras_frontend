import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { Ubigeo } from '../models/ubigeo';
import { AgenciaEnvio, CalculoEnvio, Tienda } from '../models/envio';

@Injectable({ providedIn: 'root' })
export class EnvioService {
  private readonly http = inject(HttpClient);

  searchUbigeos(q = ''): Observable<Ubigeo[]> {
    let params = new HttpParams();
    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<Ubigeo[]>(`${API_URL}/ubigeos`, { params });
  }

  calcularEnvio(ubigeo?: string | null, subtotal = 0): Observable<CalculoEnvio> {
    let params = new HttpParams().set('subtotal', subtotal.toString());
    if (ubigeo && ubigeo.trim()) {
      params = params.set('ubigeo', ubigeo.trim());
    }
    return this.http.get<CalculoEnvio>(`${API_URL}/envio/calcular`, { params });
  }

  getTiendas(): Observable<Tienda[]> {
    return this.http.get<Tienda[]>(`${API_URL}/tiendas`);
  }

  getAgencias(q = ''): Observable<AgenciaEnvio[]> {
    let params = new HttpParams();
    if (q && q.trim()) {
      params = params.set('q', q.trim());
    }
    return this.http.get<AgenciaEnvio[]>(`${API_URL}/agencias`, { params });
  }
}
