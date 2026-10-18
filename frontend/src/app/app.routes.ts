import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'browse',
    canMatch: [authGuard, roleGuard('CUSTOMER')],
    loadChildren: () => import('./features/customer/customer.routes'),
  },
  {
    path: 'my-meals',
    canMatch: [authGuard, roleGuard('MOTHER')],
    loadChildren: () => import('./features/meals/meals.routes'),
  },
  {
    path: 'deliveries',
    canMatch: [authGuard, roleGuard('DELIVERY')],
    loadChildren: () => import('./features/delivery/delivery.routes'),
  },
  {
    path: '',
    canMatch: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes'),
  },
  { path: '**', redirectTo: '' },
];
