import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { ProfileComponent } from './feature/profile/profile.component';
import { adminGuard } from './core/guards/admin.guard';


export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./feature/auth/auth/auth.component')
        .then(m => m.AuthComponent),
        canActivate: [guestGuard]
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./feature/auth/auth/auth.component')
        .then(m => m.AuthComponent),
        canActivate: [guestGuard]
  },
  {
    path: 'verify-otp',
    loadComponent: () =>
      import('./feature/auth/auth/auth.component')
        .then(m => m.AuthComponent),
    canActivate: [guestGuard]
  },

  // {
  //   path: 'forgot-password',
  //   loadComponent: () =>
  //     import('./feature/auth/forgot-password/forgot-password.component')
  //       .then(m => m.ForgotPasswordComponent)
  // },
  //public
  {
    path: 'product/:id',
    loadComponent: () =>
      import('./feature/product-details/product-details.component')
        .then(m => m.ProductDetailsComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./feature/home/home.component')
        .then(m => m.HomeComponent),
        
  },
  {
    path: 'books',
    loadComponent: () =>
      import('./feature/books/books.component')
        .then(m => m.BooksComponent),
    
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [authGuard]
  },

  //prvate
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
    path: 'wishlist',
    loadComponent: () =>
      import('./feature/wishlist/wishlist.component')
        .then(m => m.WishlistComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./feature/admin/admin-layout/admin-layout.component')
        .then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
  
    children: [
  
      {
        path: '',
        loadComponent: () =>
          import('./feature/admin/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },
  
      {
        path: 'products',
        loadComponent: () =>
          import('./feature/admin/product/product.component')
            .then(m => m.AdminProductsComponent)
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./feature/admin/users/users.component')
            .then(m => m.UsersComponent)
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./feature/admin/orders/orders.component')
            .then(m => m.OrdersComponent)
      }
  
    ]
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
