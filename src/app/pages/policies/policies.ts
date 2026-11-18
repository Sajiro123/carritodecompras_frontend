import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Politica } from '../../models/politica';
import { PoliticaService } from '../../services/politica.service';

@Component({
  selector: 'app-policies',
  imports: [DatePipe, RouterLink],
  templateUrl: './policies.html',
  styleUrl: './policies.scss',
})
export class Policies implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly politicaService = inject(PoliticaService);

  readonly politica = signal<Politica | null>(null);
  readonly currentSlug = signal('');
  readonly loading = signal(true);
  readonly error = signal('');

  readonly policyLinks = [
    { slug: 'terminos-y-condiciones', label: 'Términos y Condiciones' },
    { slug: 'politicas-de-privacidad', label: 'Políticas de Privacidad' },
    { slug: 'cambios-y-devoluciones', label: 'Cambios y Devoluciones' },
    { slug: 'libro-de-reclamaciones', label: '📖 Libro de Reclamaciones' },
  ];

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug') || 'terminos-y-condiciones';
      this.loadPolicy(slug);
    });
  }

  loadPolicy(slug: string): void {
    this.currentSlug.set(slug);
    this.loading.set(true);
    this.error.set('');

    this.politicaService.getBySlug(slug).subscribe({
      next: (data) => {
        this.politica.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo encontrar la política solicitada.');
      },
    });
  }
}
