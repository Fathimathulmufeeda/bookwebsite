import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  forkJoin,
  switchMap,
  map
} from 'rxjs';

import {
  Order,
  OrderStatus
} from '../Models/order.model';

import { Product } from '../Models/Product.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);

  private apiUrl =
    'http://localhost:3000/orders';

  private productsUrl =
    'http://localhost:3000/products';


  saveOrder(order: Order): Observable<Order> {

    // Get the latest product information
    const stockChecks = order.items.map(item =>
      this.http.get<Product>(
        `${this.productsUrl}/${item.product.id}`
      )
    );


    return forkJoin(stockChecks).pipe(

      switchMap(products => {

        // Check stock before creating order
        for (let i = 0; i < products.length; i++) {

          const product = products[i];

          const orderedItem =
            order.items[i];

          if (
            product.stock <
            orderedItem.quantity
          ) {

            throw new Error(
              `Only ${product.stock} copies of "${product.title}" are available.`
            );

          }

        }


        // Stock is available
        // Now create the order
        return this.http
          .post<Order>(
            this.apiUrl,
            order
          )
          .pipe(

            switchMap(savedOrder => {

              // Reduce stock
              const stockUpdates =
                products.map(
                  (product, index) => {

                    const quantity =
                      order.items[index].quantity;

                    const newStock =
                      product.stock - quantity;

                    return this.http.patch<Product>(
                      `${this.productsUrl}/${product.id}`,
                      {
                        stock: newStock
                      }
                    );

                  }
                );


              return forkJoin(
                stockUpdates
              ).pipe(

                map(() => savedOrder)

              );

            })

          );

      })

    );

  }


  getOrders(
    userId?: number
  ): Observable<Order[]> {

    const url =
      userId != null

        ? `${this.apiUrl}?userId=${userId}&_sort=id&_order=desc`

        : `${this.apiUrl}?_sort=id&_order=desc`;

    return this.http.get<Order[]>(url);

  }


  updateOrderStatus(
    id: number,
    status: OrderStatus
  ): Observable<Order> {

    return this.http.patch<Order>(
      `${this.apiUrl}/${id}`,
      {
        status
      }
    );

  }

}