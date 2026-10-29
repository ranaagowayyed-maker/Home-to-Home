import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    title: 'Browse Meals · From Home To Home',
    loadComponent: () => import('./browse-page').then((m) => m.BrowsePage),
  },
  {
    path: ':id',
    title: 'Meal · From Home To Home',
    loadComponent: () => import('./meal-detail-page').then((m) => m.MealDetailPage),
  },
];

export default routes;
