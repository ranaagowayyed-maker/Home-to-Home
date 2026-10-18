import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'From Home To Home',
    loadComponent: () => import('./landing-page').then((m) => m.LandingPage),
  },
  {
    path: 'login',
    title: 'Log in · From Home To Home',
    loadComponent: () => import('./login-page').then((m) => m.LoginPage),
  },
  {
    path: 'signup',
    title: 'Sign up · From Home To Home',
    loadComponent: () => import('./signup-page').then((m) => m.SignupPage),
  },
];

export default routes;
