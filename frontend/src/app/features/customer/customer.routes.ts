import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    title: 'Browse Meals · From Home To Home',
    loadComponent: () => import('./browse-page').then((m) => m.BrowsePage),
  },
];

export default routes;
