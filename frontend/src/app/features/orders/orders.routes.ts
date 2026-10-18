import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canMatch: [roleGuard('CUSTOMER')],
    title: 'My Orders · From Home To Home',
    loadComponent: () => import('./my-orders-page').then((m) => m.MyOrdersPage),
  },
  {
    path: ':id',
    title: 'Order · From Home To Home',
    loadComponent: () => import('./order-page').then((m) => m.OrderPage),
  },
];

export default routes;
