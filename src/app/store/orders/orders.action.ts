import { createAction, props } from '@ngrx/store';
import { Order } from '../../core/Models/order.model';

export const addOrder = createAction(
  '[Orders] Add Order',
  props<{ order: Order }>()
);
export const loadOrders = createAction(
  '[Orders] Load Orders'
);

export const loadOrdersSuccess = createAction(
  '[Orders] Load Orders Success',
  props<{ orders: Order[] }>()
);

export const loadOrdersFailure = createAction(
  '[Orders] Load Orders Failure',
  props<{ error: string }>()
);