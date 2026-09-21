import { createFeatureSelector, createSelector } from '@ngrx/store';
import { WishlistState } from './wishlist.reducer';

export const selectWishlistState =
  createFeatureSelector<WishlistState>('wishlist');

export const selectWishlistProducts =
  createSelector(
    selectWishlistState,
    state => state.products
  );

export const selectWishlistCount =
  createSelector(
    selectWishlistProducts,
    products => products.length
  );