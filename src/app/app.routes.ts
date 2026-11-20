import { Routes } from '@angular/router';
import { authGuard, guestOnlyGuard } from './core/auth.guard';
import { AdminLayout } from './layouts/admin-layout/admin-layout';
import { StoreLayout } from './layouts/store-layout/store-layout';
import { AdminDashboard } from './pages/admin-dashboard/admin-dashboard';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { Contact } from './pages/contact/contact';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { OrderSuccess } from './pages/order-success/order-success';
import { Orders } from './pages/orders/orders';
import { Policies } from './pages/policies/policies';
import { ProductList } from './pages/product-list/product-list';
import { StorageDemo } from './pages/storage-demo/storage-demo';

export const routes: Routes = [
  // 1. Tienda pública (Inicio + Catálogo de Productos + Carrito/Checkout)
  {
    path: '',
    component: StoreLayout,
    children: [
      { path: '', component: Home },
      { path: 'catalogo', component: ProductList },
      { path: 'catalog', redirectTo: 'catalogo', pathMatch: 'full' },
      { path: 'cart', component: Cart },
      { path: 'checkout', component: Checkout },
      { path: 'order-success/:id', component: OrderSuccess },
      { path: 'orders', component: Orders },
      { path: 'policies/:slug', component: Policies },
      { path: 'contact', component: Contact },
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
