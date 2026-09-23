import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import {
  addOrder,
  cancelOrder,
  cancelOrderFailure,
  cancelOrderSuccess,
  loadOrders,
  loadOrdersFailure,
  loadOrdersSuccess
} from './orders.action';

import { OrderService } from '../../core/services/order.service';

@Injectable()
export class OrdersEffect {

  private actions$ = inject(Actions);
  private orderService = inject(OrderService);

  // Save new order to JSON Server
  saveOrder$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(addOrder),
        switchMap(({ order }) =>
          this.orderService.saveOrder(order)
        )
      ),
    { dispatch: false }
  );

  // Load existing orders from JSON Server, scoped to the current user when provided
  loadOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadOrders),

      switchMap(({ userId }) =>
        this.orderService.getOrders(userId).pipe(

          map(orders =>
            loadOrdersSuccess({ orders })
          ),

          catchError(error =>
            of(
              loadOrdersFailure({
                error: error.message
              })
            )
          )

        )
      )
    )
  );

  // Cancel an order
  cancelOrder$ = createEffect(() =>
    this.actions$.pipe(
      ofType(cancelOrder),

      switchMap(({ orderId }) =>
        this.orderService.updateOrderStatus(orderId, 'Cancelled').pipe(

          map(order =>
            cancelOrderSuccess({ order })
          ),

          catchError(error =>
            of(
              cancelOrderFailure({
                error: error.message
              })
            )
          )

        )
      )
    )
  );

}
