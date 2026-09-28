import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';

import {
  catchError,
  EMPTY,
  map,
  switchMap,
  withLatestFrom
} from 'rxjs';

import {
  addToWishlist,
  removeFromWishlist,
  loadWishlist,
  loadWishlistSuccess
} from './wishlist.action';

import { WishlistService } from '../../core/services/wishlist.service';
import { selectWishlistProducts } from './wishlist.selectors';

@Injectable()
export class WishlistEffect {

  private actions$ = inject(Actions);
  private store = inject(Store);
  private wishlistService = inject(WishlistService);

  // Save wishlist changes to db.json
  saveWishlist$ = createEffect(
    () =>
      this.actions$.pipe(

        ofType(
          addToWishlist,
          removeFromWishlist
        ),

        withLatestFrom(
          this.store.select(selectWishlistProducts)
        ),

        switchMap(([, products]) =>
          this.wishlistService.saveWishlist(products).pipe(

            catchError(error => {
              console.error('Failed to save wishlist:', error);
              return EMPTY;
            })

          )
        )
      ),

    { dispatch: false }
  );


  // Load wishlist from db.json
  loadWishlist$ = createEffect(() =>
    this.actions$.pipe(

      ofType(loadWishlist),

      switchMap(() =>
        this.wishlistService.getWishlist().pipe(

          map(products =>
            loadWishlistSuccess({
              products
            })
          ),

          catchError(error => {
            console.error('Failed to load wishlist:', error);

            return [
              loadWishlistSuccess({
                products: []
              })
            ];
          })

        )
      )
    )
  );

}