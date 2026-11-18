import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, map, of, switchMap, throwError } from 'rxjs';
import { ImageUpload } from '../../components/image-upload/image-upload';
import { ProductService } from '../../services/product.service';
import { StorageFolder, StorageService, UploadResponse } from '../../services/storage.service';

export interface UploadedRecord {
  folder: StorageFolder;
  upload: UploadResponse;
  title: string;
  subtitle: string;
  savedInBackend: boolean;
  productId?: number;
}

const FOLDER_META: Record<StorageFolder, { label: string; helper: string; submitLabel: string }> = {
  productos: {
    label: 'Productos',
    helper: 'Los campos obligatorios permiten crear el producto en la tienda junto con su imagen en Supabase.',
    submitLabel: 'Subir imagen y guardar producto',
  },
  categorias: {
    label: 'Categorías',
    helper: 'Completa los campos obligatorios de la categoría antes de subir su imagen a Supabase.',
    submitLabel: 'Subir imagen de categoría',
  },
  banners: {
    label: 'Banners',
    helper: 'Indica ubicación y título obligatorios del banner antes de subir el archivo.',
    submitLabel: 'Subir imagen de banner',
  },
  resenas: {
    label: 'Reseñas',
    helper: 'Completa los datos obligatorios de la reseña antes de subir la foto.',
    submitLabel: 'Subir foto de reseña',
  },
  comprobantes: {
    label: 'Comprobantes',
    helper: 'Registra los datos obligatorios del pago antes de subir el comprobante.',
    submitLabel: 'Subir comprobante',
  },
};

@Component({
  selector: 'app-storage-demo',
  imports: [FormsModule, ReactiveFormsModule, ImageUpload],
  templateUrl: './storage-demo.html',
  styleUrl: './storage-demo.scss',
})
export class StorageDemo {
  private readonly fb = inject(FormBuilder);
  private readonly storage = inject(StorageService);
  private readonly productService = inject(ProductService);

  private readonly uploader = viewChild(ImageUpload);

  readonly folders: StorageFolder[] = ['productos', 'categorias', 'banners', 'resenas', 'comprobantes'];
  readonly folderMeta = FOLDER_META;

  readonly selectedFolder = signal<StorageFolder>('productos');
  readonly selectedFile = signal<File | null>(null);
  readonly submitAttempted = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly copiedPath = signal('');
  readonly history = signal<UploadedRecord[]>([]);

  private slugTouchedManually = false;

  readonly forms: Record<StorageFolder, FormGroup> = {
    productos: this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      price: [null as number | null, [Validators.required, Validators.min(0.01)]],
      stock: [null as number | null, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
      description: ['', [Validators.maxLength(500)]],
    }),
    categorias: this.fb.nonNullable.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      slug: ['', [Validators.required, Validators.maxLength(120), Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
      descripcion: ['', [Validators.maxLength(300)]],
    }),
    banners: this.fb.nonNullable.group({
      ubicacion: ['HERO', [Validators.required]],
      titulo: ['', [Validators.required, Validators.maxLength(150)]],
      subtitulo: ['', [Validators.maxLength(255)]],
      textoCta: ['', [Validators.maxLength(60)]],
      urlCta: ['', [Validators.maxLength(200)]],
    }),
    resenas: this.fb.nonNullable.group({
      productoId: [null as number | null, [Validators.required, Validators.min(1), Validators.pattern(/^\d+$/)]],
      nombreAutor: ['', [Validators.required, Validators.maxLength(100)]],
      calificacion: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comentario: ['', [Validators.required, Validators.maxLength(1000)]],
    }),
    comprobantes: this.fb.nonNullable.group({
      pedidoRef: ['', [Validators.required, Validators.maxLength(40)]],
      metodoPago: ['BCP', [Validators.required]],
      numeroOperacion: ['', [Validators.required, Validators.maxLength(60)]],
    }),
  };

  readonly activeForm = computed(() => this.forms[this.selectedFolder()]);
  readonly activeMeta = computed(() => this.folderMeta[this.selectedFolder()]);

  onFolderChange(folder: StorageFolder): void {
    this.selectedFolder.set(folder);
    this.submitAttempted.set(false);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onFileChanged(file: File | null): void {
    this.selectedFile.set(file);
    if (file) {
      this.errorMessage.set('');
    }
  }

  onCategoryNameInput(): void {
    if (this.slugTouchedManually) return;
    const nombre = String(this.forms.categorias.get('nombre')?.value ?? '');
    this.forms.categorias.get('slug')?.setValue(this.slugify(nombre), { emitEvent: false });
  }

  onSlugInput(): void {
    this.slugTouchedManually = true;
  }

  hasError(controlName: string): boolean {
    const control = this.activeForm().get(controlName);
    return !!control && control.invalid && (control.touched || this.submitAttempted());
  }

  submit(): void {
    const folder = this.selectedFolder();
    const form = this.forms[folder];
    const file = this.selectedFile();

    this.submitAttempted.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    form.markAllAsTouched();

    if (form.invalid || !file) {
      this.errorMessage.set(
        !file
          ? 'Selecciona o arrastra una imagen y completa los campos obligatorios.'
          : 'Completa todos los campos obligatorios marcados con * antes de subir la imagen.'
      );
      return;
    }

    this.submitting.set(true);

    this.storage
      .upload(file, folder)
      .pipe(
        switchMap((upload) => {
          if (folder !== 'productos') {
            return of({ upload, productId: undefined as number | undefined });
          }
          const raw = form.getRawValue();
          return this.productService
            .create({
              name: String(raw.name).trim(),
              description: raw.description ? String(raw.description).trim() : null,
              price: Number(raw.price),
              stock: Number(raw.stock),
              imageUrl: upload.publicUrl,
            })
            .pipe(
              map((product) => ({ upload, productId: product.id })),
              catchError((err) =>
                this.storage.delete(upload.path).pipe(
                  catchError(() => of(void 0)),
                  switchMap(() => throwError(() => err))
                )
              )
            );
        })
      )
      .subscribe({
        next: ({ upload, productId }) => {
          const record = this.buildRecord(folder, form.getRawValue(), upload, productId);
          this.history.update((items) => [record, ...items]);
          this.resetCurrentForm(folder);
          this.uploader()?.clearSelection();
          this.submitting.set(false);
          this.successMessage.set(
            productId
              ? `Imagen subida a Supabase y producto #${productId} guardado en la tienda.`
              : `Imagen subida correctamente a ${folder}/ con sus datos obligatorios.`
          );
        },
        error: (err) => {
          this.submitting.set(false);
          this.errorMessage.set(err.error?.message ?? 'No se pudo completar la operación.');
        },
      });
  }

  copyUrl(item: UploadedRecord): void {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(item.upload.publicUrl).then(() => {
      this.copiedPath.set(item.upload.path);
      setTimeout(() => this.copiedPath.set(''), 1800);
    });
  }

  deleteFromHistory(item: UploadedRecord): void {
    this.storage.delete(item.upload.path).subscribe({
      next: () => {
        this.history.update((items) => items.filter((entry) => entry.upload.path !== item.upload.path));
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message ?? 'No se pudo eliminar la imagen de Supabase.');
      },
    });
  }

  private resetCurrentForm(folder: StorageFolder): void {
    this.submitAttempted.set(false);
    if (folder === 'banners') {
      this.forms.banners.reset({ ubicacion: 'HERO', titulo: '', subtitulo: '', textoCta: '', urlCta: '' });
      return;
    }
    if (folder === 'resenas') {
      this.forms.resenas.reset({ productoId: null, nombreAutor: '', calificacion: 5, comentario: '' });
      return;
    }
    if (folder === 'comprobantes') {
      this.forms.comprobantes.reset({ pedidoRef: '', metodoPago: 'BCP', numeroOperacion: '' });
      return;
    }
    if (folder === 'categorias') {
      this.slugTouchedManually = false;
    }
    this.forms[folder].reset();
  }

  private buildRecord(
    folder: StorageFolder,
    raw: Record<string, unknown>,
    upload: UploadResponse,
    productId?: number
  ): UploadedRecord {
    switch (folder) {
      case 'productos':
        return {
          folder,
          upload,
          title: String(raw['name'] ?? ''),
          subtitle: `S/ ${Number(raw['price']).toFixed(2)} · Stock: ${raw['stock']}`,
          savedInBackend: true,
          productId,
        };
      case 'categorias':
        return {
          folder,
          upload,
          title: String(raw['nombre'] ?? ''),
          subtitle: `Slug: ${raw['slug']}`,
          savedInBackend: false,
        };
      case 'banners':
        return {
          folder,
          upload,
          title: String(raw['titulo'] ?? ''),
          subtitle: `Ubicación: ${raw['ubicacion']}`,
          savedInBackend: false,
        };
      case 'resenas':
        return {
          folder,
          upload,
          title: `${raw['nombreAutor']} (${raw['calificacion']}★)`,
          subtitle: `Producto #${raw['productoId']}`,
          savedInBackend: false,
        };
      case 'comprobantes':
        return {
          folder,
          upload,
          title: `Pedido ${raw['pedidoRef']} · ${raw['metodoPago']}`,
          subtitle: `Operación: ${raw['numeroOperacion']}`,
          savedInBackend: false,
        };
    }
  }

  private slugify(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
