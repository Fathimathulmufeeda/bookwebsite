import { createReducer, on } from '@ngrx/store';
import { Product } from '../../core/Models/Product.model';

import { addToWishlist,loadWishlistSuccess,removeFromWishlist} from './wishlist.action';

export interface WishlistState {
  products: Product[];
}

const initialState: WishlistState = {
  products: []
};

export const wishlistReducer = createReducer(

  initialState,

  on(addToWishlist, (state, { product }) => {

    const alreadyExists = state.products.some(
      item => item.id === product.id
    );

    if (alreadyExists) {
      return state;
    }

    return {
      ...state,
      products: [...state.products, product]
    };
  }),

  on(removeFromWishlist, (state, { productId }) => ({
    ...state,
    products: state.products.filter(
      product => product.id !== productId
    )
  })),
  on(loadWishlistSuccess, (state, { products }) => ({
    ...state,
    products
  }))

);