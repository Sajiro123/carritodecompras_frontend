import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BRAND_CONFIG } from '../../core/brand.config';

@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
})
export class AdminDashboard {
  readonly brand = BRAND_CONFIG;
}
