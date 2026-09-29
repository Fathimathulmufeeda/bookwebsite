import { createReducer, on } from '@ngrx/store';
import { CartItem } from '../../core/Models/cart-item.model';
import { MAX_BOOK_QUANTITY, MAX_CART_PRODUCTS } from './cart.constant';
import {addToCart,increaseQuantity,decreaseQuantity,removeFromCart,clearCart, loadCartSuccess} from './cart.action';



export interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: []
};

export const cartReducer = createReducer(

  initialState,

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
    if (!existingItem && state.items.length >= MAX_CART_PRODUCTS) {
      return state;
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

  on(removeFromCart, (state, { productId }) => ({

    ...state,

    items: state.items.filter(
      item => item.product.id !== productId
    )
  })),

  
  on(clearCart, () => ({
    items: []
  })),
  
  on(loadCartSuccess, (state, { items }) => ({
    ...state,
    items
  }))

);