import { Routes } from '@angular/router';
import { ProductList } from './pages/product-list/product-list';
import { Cart } from './pages/cart/cart';
import { Checkout } from './pages/checkout/checkout';
import { OrderSuccess } from './pages/order-success/order-success';
import { Orders } from './pages/orders/orders';
import { Policies } from './pages/policies/policies';
import { Contact } from './pages/contact/contact';

export const routes: Routes = [
  { path: '', component: ProductList },
  { path: 'cart', component: Cart },
  { path: 'checkout', component: Checkout },
  { path: 'order-success/:id', component: OrderSuccess },
  { path: 'orders', component: Orders },
  { path: 'policies/:slug', component: Policies },
  { path: 'contact', component: Contact },
  { path: '**', redirectTo: '' },
];
