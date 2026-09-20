import { createReducer, on } from '@ngrx/store';
import { CartItem } from '../../core/Models/cart-item.model';

import {
  addToCart,
  increaseQuantity,
  decreaseQuantity,
  removeFromCart
} from './cart.action';

export interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: []
};

export const cartReducer = createReducer(
  initialState,

  // Add product to cart
  on(addToCart, (state, { item }) => {

    const existingItem = state.items.find(
      cartItem => cartItem.product.id === item.product.id
    );

    // increasing  the quantityof existing product
    if (existingItem) {
      return {
        ...state,
        items: state.items.map(cartItem =>
          cartItem.product.id === item.product.id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + item.quantity
              }
            : cartItem
        )
      };
    }

    // adding new product
    return {
      ...state,
      items: [...state.items, item]
    };
  }),

  // Increase quantity
  on(increaseQuantity, (state, { productId }) => ({
    ...state,
  
    items: state.items.map(item =>
      item.product.id === productId &&
      item.quantity < item.product.stock
        ? {
            ...item,
            quantity: item.quantity + 1
          }
        : item
    )
  })),

  // Decrease quantity
  on(decreaseQuantity, (state, { productId }) => ({
    ...state,
  
    items: state.items
      .map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity: item.quantity - 1
            }
          : item
      )
      .filter(item => item.quantity > 0)
  })),
  //removing product
  on(removeFromCart, (state, { productId }) => ({
    ...state,
    items: state.items.filter(
      item => item.product.id !== productId
    )
  }))
);