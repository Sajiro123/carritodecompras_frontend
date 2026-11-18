import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { API_URL } from '../core/api.config';
import { Product } from '../models/product';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_URL}/products`;

  getAll(params?: Record<string, any>): Observable<Product[]> {
    return this.http.get<any>(this.endpoint, { params }).pipe(
      map((res: any) => (Array.isArray(res) ? res : (res?.content ?? [])))
    );
  }

  getPaged(params?: Record<string, any>): Observable<any> {
    return this.http.get<any>(this.endpoint, { params });
  }

  getFilterOptions(): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/filters`);
  }

  getCategories(): Observable<any[]> {
    return this.http.get<any[]>(`${API_URL}/categories`);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.endpoint}/${id}`);
  }

  getBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.endpoint}/${slug}`);
  }

  getReviews(productIdOrSlug: string | number): Observable<any[]> {
    return this.http.get<any[]>(`${this.endpoint}/${productIdOrSlug}/reviews`);
  }

  addReview(productIdOrSlug: string | number, review: any): Observable<any> {
    return this.http.post<any>(`${this.endpoint}/${productIdOrSlug}/reviews`, review);
  }
}
