
import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { map, tap, withLatestFrom } from 'rxjs';

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

  saveWishlist$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(addToWishlist, removeFromWishlist),

        withLatestFrom(
          this.store.select(selectWishlistProducts)
        ),

        tap(([, products]) => {
          this.wishlistService.saveWishlist(products);
        })
      ),
    { dispatch: false }
  );

  loadWishlist$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadWishlist),

      map(() =>
        loadWishlistSuccess({
          products: this.wishlistService.getWishlist()
        })
      )
    )
  );
}

