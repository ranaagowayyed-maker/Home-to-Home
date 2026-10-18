import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    title: 'My Meals · From Home To Home',
    loadComponent: () => import('./my-meals-page').then((m) => m.MyMealsPage),
  },
  {
    path: 'new',
    title: 'New meal · From Home To Home',
    loadComponent: () => import('./meal-form-page').then((m) => m.MealFormPage),
  },
  {
    path: ':id/edit',
    title: 'Edit meal · From Home To Home',
    loadComponent: () => import('./meal-form-page').then((m) => m.MealFormPage),
  },
];

export default routes;
