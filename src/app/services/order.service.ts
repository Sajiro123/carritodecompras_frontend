import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { CreateOrderPayload, OrderDetail, OrderResponse } from '../models/order';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_URL}/orders`;

  create(payload: CreateOrderPayload): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.endpoint, payload);
  }

  getById(id: number): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(`${this.endpoint}/${id}`);
  }

  getSeguimiento(codigo: string, telefono: string): Observable<OrderDetail> {
    const params = new HttpParams()
      .set('codigo', codigo.trim())
      .set('telefono', telefono.trim());
    return this.http.get<OrderDetail>(`${this.endpoint}/seguimiento`, { params });
  }
}
