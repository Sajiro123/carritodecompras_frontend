import { Component, OnDestroy, computed, inject, input, output, signal } from '@angular/core';
import { StorageFolder, StorageService, UploadResponse } from '../../services/storage.service';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.scss',
})
export class ImageUpload implements OnDestroy {
  private readonly storage = inject(StorageService);

  readonly folder = input<StorageFolder>('productos');
  readonly label = input('Subir imagen');
  readonly autoUpload = input(true);
  readonly externalBusy = input(false);

  readonly uploaded = output<UploadResponse>();
  readonly removed = output<string>();
  readonly fileChanged = output<File | null>();

  readonly uploading = signal(false);
  readonly busy = computed(() => this.uploading() || this.externalBusy());
  readonly error = signal('');
  readonly previewUrl = signal('');
  readonly selectedFileName = signal('');
  readonly result = signal<UploadResponse | null>(null);
  readonly copied = signal(false);

  private objectUrlToRevoke = '';

  onFileSelected(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) return;
    this.handleFile(file);
    inputEl.value = '';
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (this.busy()) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  clearSelection(): void {
    this.result.set(null);
    this.error.set('');
    this.selectedFileName.set('');
    this.revokePreview();
    this.previewUrl.set('');
    this.fileChanged.emit(null);
  }

  removeFile(): void {
    const current = this.result();
    if (!current) {
      this.clearSelection();
      return;
    }

    this.uploading.set(true);
    this.error.set('');
    this.storage.delete(current.path).subscribe({
      next: () => {
        this.removed.emit(current.path);
        this.result.set(null);
        this.selectedFileName.set('');
        this.revokePreview();
        this.previewUrl.set('');
        this.uploading.set(false);
        this.fileChanged.emit(null);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo eliminar el archivo');
        this.uploading.set(false);
      },
    });
  }

  copyUrl(): void {
    const url = this.result()?.publicUrl;
    if (!url || !navigator.clipboard) return;
    navigator.clipboard.writeText(url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1800);
    });
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  private handleFile(file: File): void {
    this.error.set('');
    if (!ALLOWED_TYPES.includes(file.type)) {
      this.error.set('Formato inválido. Solo se permiten JPG, PNG, WEBP o GIF.');
      return;
    }
    if (file.size > MAX_BYTES) {
      this.error.set('La imagen supera el límite de 5 MB.');
      return;
    }

    this.revokePreview();
    this.objectUrlToRevoke = URL.createObjectURL(file);
    this.previewUrl.set(this.objectUrlToRevoke);
    this.selectedFileName.set(file.name);
    this.result.set(null);
    this.fileChanged.emit(file);

    if (!this.autoUpload()) {
      return;
    }

    this.uploading.set(true);
    this.storage.upload(file, this.folder()).subscribe({
      next: (res) => {
        this.result.set(res);
        this.uploading.set(false);
        this.uploaded.emit(res);
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'Error al subir la imagen al servidor');
        this.uploading.set(false);
      },
    });
  }

  private revokePreview(): void {
    if (this.objectUrlToRevoke) {
      URL.revokeObjectURL(this.objectUrlToRevoke);
      this.objectUrlToRevoke = '';
    }
  }
}
