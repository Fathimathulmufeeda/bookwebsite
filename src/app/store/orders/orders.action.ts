import { createAction, props } from '@ngrx/store';
import { Order, OrderStatus } from '../../core/Models/order.model';

export const addOrder = createAction(
  '[Orders] Add Order',
  props<{ order: Order }>()
);

export const loadOrders = createAction(
  '[Orders] Load Orders',
  props<{ userId?: number }>()
);

export const loadOrdersSuccess = createAction(
  '[Orders] Load Orders Success',
  props<{ orders: Order[] }>()
);

export const loadOrdersFailure = createAction(
  '[Orders] Load Orders Failure',
  props<{ error: string }>()
);

export const cancelOrder = createAction(
  '[Orders] Cancel Order',
  props<{ orderId: number }>()
);

export const cancelOrderSuccess = createAction(
  '[Orders] Cancel Order Success',
  props<{ order: Order }>()
);

export const cancelOrderFailure = createAction(
  '[Orders] Cancel Order Failure',
  props<{ error: string }>()
);
