import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard } from './core/auth.guard';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { StoreLayout } from './layouts/store-layout/store-layout';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { Login } from './pages/login/login';
import { OrderSuccess } from './pages/order-success/order-success';
import { ProductList } from './pages/product-list/product-list';
import { StorageDemo } from './pages/storage-demo/storage-demo';

export const routes: Routes = [
  // 1. Tienda pública (venta al público, sin login)
  {
    path: '',
    component: StoreLayout,
    children: [
      { path: '', component: ProductList },
      { path: 'cart', component: Cart },
      { path: 'checkout', component: Checkout },
      { path: 'order-success/:id', component: OrderSuccess },
    ],
  },

  // 2. Login administrativo (con logo estático)
  {
    path: 'login',
    component: Login,
    canActivate: [guestOnlyGuard],
  },

  // 3. Panel administrativo (protegido por authGuard)
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [authGuard],
    children: [
      { path: '', component: AdminDashboard },
      { path: 'upload', component: StorageDemo },
    ],
  },

  { path: '**', redirectTo: '' },
];
