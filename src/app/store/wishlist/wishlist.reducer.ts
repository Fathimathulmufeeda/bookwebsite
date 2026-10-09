import { createReducer, on } from '@ngrx/store';
import { Product } from '../../core/Models/Product.model';

import {
addToWishlist,
clearWishlist,
loadWishlistSuccess,
removeFromWishlist
} from './wishlist.action';
import { MAX_WISHLIST_PRODUCTS } from './wishlist.constant';

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


// Prevent duplicate products
if (alreadyExists) {
  return state;
}

// Prevent adding more than 8 products
if (state.products.length >= MAX_WISHLIST_PRODUCTS) {
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
products: products.slice(0, MAX_WISHLIST_PRODUCTS)
})),

on(clearWishlist, () => ({
products: []
}))
);
