import { createAction, props } from '@ngrx/store';
import { Order } from '../../core/Models/order.model';

export const addOrder = createAction(
  '[Orders] Add Order',
  props<{ order: Order }>()
);