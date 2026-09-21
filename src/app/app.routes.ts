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
    path: 'cart',
    loadComponent: () =>
      import('./feature/cart/cart.component')
        .then(m => m.CartComponent),
    canActivate: [authGuard]
  },
  {
    path: 'checkout',
    loadComponent: () =>
      import('./feature/checkout/checkout.component')
        .then(m => m.CheckoutComponent),
    canActivate: [authGuard]
  },
  {
    path: 'order-success',
    loadComponent: () =>
      import('./feature/order-success/order-success.component')
        .then(m => m.OrderSuccessComponent),
    canActivate: [authGuard]
  },
  {
    path: 'order-history',
    loadComponent: () =>
      import('./feature/order-history/order-history.component')
        .then(m => m.OrderHistoryComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
