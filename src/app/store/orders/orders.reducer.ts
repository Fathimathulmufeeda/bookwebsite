import { createReducer, on } from '@ngrx/store';
import { Order } from '../../core/Models/order.model';
import { addOrder } from './orders.action';

export interface OrdersState {
  orders: Order[];
}

const initialState: OrdersState = {
  orders: []
};

export const ordersReducer = createReducer(
  initialState,

  on(addOrder, (state, { order }) => ({
    ...state,
    orders: [...state.orders, order]
  }))
);