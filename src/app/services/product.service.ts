import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../core/api.config';
import { CreateProductRequest, Product } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_URL}/products`;

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.endpoint);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.endpoint}/${id}`);
  }

  create(payload: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.endpoint, payload);
  }
}
