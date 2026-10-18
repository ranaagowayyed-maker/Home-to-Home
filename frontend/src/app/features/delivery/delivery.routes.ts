import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    title: 'Available Deliveries · From Home To Home',
    loadComponent: () =>
      import('./available-deliveries-page').then((m) => m.AvailableDeliveriesPage),
  },
];

export default routes;
