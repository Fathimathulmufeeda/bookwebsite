import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideState, provideStore } from '@ngrx/store';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { productsReducer } from './store/product/products.reducer';
import { provideEffects } from '@ngrx/effects';
import { ProductsEffects } from './store/product/products.effects';
import { cartReducer } from './store/cart/cart.reducer';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),

  
    provideStore(),
    provideState('products', productsReducer),
    provideState('cart', cartReducer),
    provideEffects(ProductsEffects)
  ]
};