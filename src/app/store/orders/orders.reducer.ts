import { createReducer, on } from '@ngrx/store';

import { Order } from '../../core/Models/order.model';

import {
  addOrder,
  addOrderSuccess,
  addOrderFailure,
  cancelOrderFailure,
  cancelOrderSuccess,
  loadOrdersFailure,
  loadOrdersSuccess
} from './orders.action';

export interface OrdersState {

  orders: Order[];

  loading: boolean;

  error: string | null;

}

const initialState: OrdersState = {

  orders: [],

  loading: false,

  error: null

};

export const ordersReducer = createReducer(

  initialState,

  // Start placing order
  on(addOrder, state => ({

    ...state,

    loading: true,

    error: null

  })),

  // Order successfully saved
  on(addOrderSuccess, (state, { order }) => ({

    ...state,

    orders: [...state.orders, order],

    loading: false,

    error: null

  })),

  // Order failed
  on(addOrderFailure, (state, { error }) => ({

    ...state,

    loading: false,

    error

  })),

  // Orders loaded
  on(loadOrdersSuccess, (state, { orders }) => ({

    ...state,

    orders,

    loading: false,

    error: null

  })),

  // Loading orders failed
  on(loadOrdersFailure, (state, { error }) => ({

    ...state,

    loading: false,

    error

  })),

  // Order cancelled successfully
  on(cancelOrderSuccess, (state, { order }) => ({

    ...state,

    orders: state.orders.map(
      o => o.id === order.id ? order : o
    )

  })),

  // Order cancellation failed
  on(cancelOrderFailure, (state, { error }) => ({

    ...state,

    error

  }))

);