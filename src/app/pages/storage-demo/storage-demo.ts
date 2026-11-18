import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ImageUpload } from '../../components/image-upload/image-upload';
import { StorageFolder, UploadResponse } from '../../services/storage.service';

@Component({
  selector: 'app-storage-demo',
  imports: [FormsModule, ImageUpload],
  templateUrl: './storage-demo.html',
  styleUrl: './storage-demo.scss',
})
export class StorageDemo {
  readonly folders: StorageFolder[] = ['productos', 'categorias', 'banners', 'resenas', 'comprobantes'];
  readonly selectedFolder = signal<StorageFolder>('productos');
  readonly history = signal<UploadResponse[]>([]);

  onUploaded(res: UploadResponse): void {
    this.history.update((items) => [res, ...items]);
  }

  onRemoved(path: string): void {
    this.history.update((items) => items.filter((item) => item.path !== path));
  }
}
