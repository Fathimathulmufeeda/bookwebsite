import { Routes } from '@angular/router';
import { LoginComponent } from './feature/auth/login/login.component.js';


export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>
          import('./feature/auth/login/login.component.js')
            .then(m => m.LoginComponent)
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./feature/home/home.component')
            .then(m => m.HomeComponent)
      }
];
