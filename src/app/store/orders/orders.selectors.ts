import { createFeatureSelector, createSelector } from '@ngrx/store';
import { OrdersState } from './orders.reducer';

export const selectOrdersState =
  createFeatureSelector<OrdersState>('orders');

export const selectOrders =
  createSelector(
    selectOrdersState,
    state => state.orders
  );
  export const selectLatestOrder = createSelector(
    selectOrders,
    orders => orders.length > 0 ? orders[orders.length - 1] : null
  );