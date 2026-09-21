import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';

import {
  addOrder,
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

  // Load existing orders from JSON Server
  loadOrders$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadOrders),

      switchMap(() =>
        this.orderService.getOrders().pipe(

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

}