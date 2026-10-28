import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Orders · From Home To Home',
    loadComponent: () => import('./my-orders-page').then((m) => m.MyOrdersPage),
  },
  {
    path: ':id',
    title: 'Order · From Home To Home',
    loadComponent: () => import('./order-page').then((m) => m.OrderPage),
  },
];

export default routes;
