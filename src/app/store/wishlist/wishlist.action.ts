import { createAction, props } from '@ngrx/store';
import { Product } from '../../core/Models/Product.model';

export const addToWishlist = createAction(
  '[Wishlist] Add To Wishlist',
  props<{ product: Product }>()
);

export const removeFromWishlist = createAction(
  '[Wishlist] Remove From Wishlist',
  props<{ productId: number }>()
);
export const loadWishlist = createAction(
    '[Wishlist] Load Wishlist'
);
  
export const loadWishlistSuccess = createAction(
    '[Wishlist] Load Wishlist Success',
    props<{ products: Product[] }>()
);
export const clearWishlist = createAction(
  '[Wishlist] Clear Wishlist'
);