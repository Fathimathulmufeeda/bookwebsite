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
import { ordersReducer } from './store/orders/orders.reducer';
import { OrdersEffect } from './store/orders/orders.effect';
import { wishlistReducer } from './store/wishlist/wishlist.reducer';
import { WishlistEffect } from './store/wishlist/wishlist.effect';
import { CartEffect } from './store/cart/cart.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(withFetch()),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),

  
    provideStore(),
    provideState('products', productsReducer),
    provideState('cart', cartReducer),
    provideState('orders', ordersReducer),
    provideState('wishlist', wishlistReducer),
    provideEffects(ProductsEffects),
    provideEffects(OrdersEffect),
    provideEffects(WishlistEffect),
    provideEffects(CartEffect)
  ]
};