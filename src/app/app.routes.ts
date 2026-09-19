import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./feature/auth/register/register.component')
        .then(m => m.RegisterComponent)
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./feature/auth/login/login.component')
        .then(m => m.LoginComponent)
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./feature/home/home.component')
        .then(m => m.HomeComponent),
        canActivate:[authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
