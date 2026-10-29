import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'browse',
    canMatch: [authGuard, roleGuard('CUSTOMER')],
    loadChildren: () => import('./features/customer/customer.routes'),
  },
  {
    path: 'cart',
    canMatch: [authGuard, roleGuard('CUSTOMER')],
    title: 'Cart · From Home To Home',
    loadComponent: () => import('./features/customer/cart-page').then((m) => m.CartPage),
  },
  {
    path: 'checkout',
    canMatch: [authGuard, roleGuard('CUSTOMER')],
    title: 'Checkout · From Home To Home',
    loadComponent: () => import('./features/customer/checkout-page').then((m) => m.CheckoutPage),
  },
  {
    // Order history at /orders and the order page at /orders/:id are shared by all three roles.
    path: 'orders',
    canMatch: [authGuard],
    loadChildren: () => import('./features/orders/orders.routes'),
  },
  {
    path: 'my-meals',
    canMatch: [authGuard, roleGuard('MOTHER')],
    loadChildren: () => import('./features/meals/meals.routes'),
  },
  {
    path: 'incoming-orders',
    canMatch: [authGuard, roleGuard('MOTHER')],
    title: 'Incoming Orders · From Home To Home',
    loadComponent: () =>
      import('./features/orders/incoming-orders-page').then((m) => m.IncomingOrdersPage),
  },
  {
    path: 'deliveries',
    canMatch: [authGuard, roleGuard('DELIVERY')],
    loadChildren: () => import('./features/delivery/delivery.routes'),
  },
  {
    path: 'profile',
    canMatch: [authGuard],
    title: 'Profile · From Home To Home',
    loadComponent: () => import('./features/profile/profile-page').then((m) => m.ProfilePage),
  },
  {
    path: '',
    canMatch: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes'),
  },
  { path: '**', redirectTo: '' },
];
