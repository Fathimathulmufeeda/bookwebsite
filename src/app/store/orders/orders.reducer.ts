import { createReducer, on } from '@ngrx/store';
import { Order } from '../../core/Models/order.model';
import { addOrder, loadOrdersFailure, loadOrdersSuccess } from './orders.action';

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

  on(addOrder, (state, { order }) => ({
    ...state,
    orders: [...state.orders, order]
  })),

  on(loadOrdersSuccess, (state, { orders }) => ({
    ...state,
    orders,
    loading: false,
    error: null
  })),
  
  on(loadOrdersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))

);