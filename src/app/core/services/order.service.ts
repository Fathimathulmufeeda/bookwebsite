import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, OrderStatus } from '../Models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/orders';

  saveOrder(order: Order): Observable<Order> {
    return this.http.post<Order>(this.apiUrl, order);
  }

  getOrders(userId?: number): Observable<Order[]> {

    const url = userId != null
      ? `${this.apiUrl}?userId=${userId}&_sort=id&_order=desc`
      : `${this.apiUrl}?_sort=id&_order=desc`;

    return this.http.get<Order[]>(url);
  }

  updateOrderStatus(id: number, status: OrderStatus): Observable<Order> {
    return this.http.patch<Order>(`${this.apiUrl}/${id}`, { status });
  }
}
