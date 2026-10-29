import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    title: 'Available Deliveries · From Home To Home',
    loadComponent: () =>
      import('./available-deliveries-page').then((m) => m.AvailableDeliveriesPage),
  },
  {
    path: 'mine',
    title: 'My Deliveries · From Home To Home',
    loadComponent: () => import('./my-deliveries-page').then((m) => m.MyDeliveriesPage),
  },
];

export default routes;
