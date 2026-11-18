import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL, SUPABASE_CONFIG } from '../core/api.config';

export type StorageFolder = 'productos' | 'categorias' | 'banners' | 'resenas' | 'comprobantes';

export interface UploadResponse {
  path: string;
  publicUrl: string;
  contentType: string;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${API_URL}/storage`;

  upload(file: File, folder: StorageFolder = 'productos'): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const params = new HttpParams().set('folder', folder);
    return this.http.post<UploadResponse>(`${this.endpoint}/upload`, formData, { params });
  }

  delete(path: string): Observable<void> {
    const params = new HttpParams().set('path', path);
    return this.http.delete<void>(this.endpoint, { params });
  }

  getPublicUrl(path: string): string {
    const cleanPath = path.replace(/^\/+/, '');
    return `${SUPABASE_CONFIG.url}/storage/v1/object/public/${SUPABASE_CONFIG.bucket}/${cleanPath}`;
  }
}
