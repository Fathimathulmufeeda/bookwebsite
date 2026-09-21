import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, tap, withLatestFrom } from 'rxjs';

import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart,
  clearCart,
  loadCart,
  loadCartSuccess
} from './cart.action';

import { CartService } from '../../core/services/cart.service';
import { selectCartItems } from './cart.selectors';

@Injectable()
export class CartEffect {

  private actions$ = inject(Actions);
  private store = inject(Store);
  private cartService = inject(CartService);

  // Save cart whenever it changes
  saveCart$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          addToCart,
          increaseQuantity,
          decreaseQuantity,
          removeFromCart,
          clearCart
        ),

        withLatestFrom(
          this.store.select(selectCartItems)
        ),

        tap(([, items]) => {
          this.cartService.saveCart(items);
        })
      ),
    { dispatch: false }
  );

  // Load cart from localStorage
  loadCart$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadCart),

      map(() =>
        loadCartSuccess({
          items: this.cartService.getCart()
        })
      )
    )
  );

}