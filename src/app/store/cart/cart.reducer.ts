import { createReducer, on } from '@ngrx/store';
import { CartItem } from '../../core/Models/cart-item.model';
import { MAX_BOOK_QUANTITY } from './cart.constant';
import {addToCart,increaseQuantity,decreaseQuantity,removeFromCart,clearCart} from './cart.action';



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

    if (existingItem) {

      return {
        ...state,

        items: state.items.map(cartItem =>
          cartItem.product.id === item.product.id
            ? {
                ...cartItem,
                quantity: Math.min(
                  cartItem.quantity + item.quantity,
                  MAX_BOOK_QUANTITY,
                  cartItem.product.stock
                )
              }
            : cartItem
        )
      };
    }

    return {
      ...state,

      items: [
        ...state.items,
        {
          ...item,
          quantity: Math.min(
            item.quantity,
            MAX_BOOK_QUANTITY,
            item.product.stock
          )
        }
      ]
    };
  }),

  // Increase quantity
  on(increaseQuantity, (state, { productId }) => ({

    ...state,

    items: state.items.map(item =>
      item.product.id === productId &&
      item.quantity < MAX_BOOK_QUANTITY &&
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

  // Remove product completely
  on(removeFromCart, (state, { productId }) => ({

    ...state,

    items: state.items.filter(
      item => item.product.id !== productId
    )
  })),

  // Clear entire cart
  on(clearCart, () => ({
    items: []
  }))

);