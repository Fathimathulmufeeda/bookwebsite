import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap } from 'rxjs';

import { CartItem } from '../Models/cart-item.model';
import { Product } from '../Models/Product.model';
import { AuthService } from './auth.service';

interface CartRecord {
  id: string;
  userId: string;
  productId: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = 'http://localhost:3000/cart';
  private productsUrl = 'http://localhost:3000/products';

  private getUserId(): string | null {

    const user = this.authService.getCurrentUser();

    if (!user) {
      return null;
    }

    return String(user.id);
  }

  saveCart(items: CartItem[]): Observable<void> {

    const userId = this.getUserId();

    if (!userId) {
      return of(void 0);
    }

    return this.http
      .get<CartRecord[]>(`${this.apiUrl}?userId=${encodeURIComponent(userId)}`)
      .pipe(
        switchMap(existingRecords => {

          const currentProductIds = new Set(
            items.map(item => item.product.id)
          );

          const recordsToDelete = existingRecords.filter(
            record => !currentProductIds.has(record.productId)
          );

          const deleteRequests = recordsToDelete.map(record =>
            this.http.delete<void>(
              `${this.apiUrl}/${encodeURIComponent(record.id)}`
            )
          );

          const saveRequests = items.map(item => {

            const existing = existingRecords.find(
              record => record.productId === item.product.id
            );

            const record: CartRecord = {
              id: existing?.id ?? `${userId}_${item.product.id}`,
              userId,
              productId: item.product.id,
              quantity: item.quantity
            };

            if (existing) {
              return this.http.put<void>(
                `${this.apiUrl}/${encodeURIComponent(record.id)}`,
                record
              );
            }

            return this.http.post<void>(
              this.apiUrl,
              record
            );
          });

          return forkJoin([
            ...deleteRequests,
            ...saveRequests
          ]).pipe(
            map(() => void 0)
          );
        })
      );
  }

  getCart(): Observable<CartItem[]> {

    const userId = this.getUserId();

    if (!userId) {
      return of([]);
    }

    return forkJoin({
      cartRecords: this.http.get<CartRecord[]>(
        `${this.apiUrl}?userId=${encodeURIComponent(userId)}`
      ),
      products: this.http.get<Product[]>(this.productsUrl)
    }).pipe(
      map(({ cartRecords, products }) => {

        return cartRecords
          .map(record => {

            const product = products.find(
              p => p.id === record.productId
            );

            if (!product) {
              return null;
            }

            return {
              product,
              quantity: record.quantity
            };
          })
          .filter(
            (item): item is CartItem => item !== null
          );
      })
    );
  }

  clearCart(): Observable<void> {
    return this.saveCart([]);
  }
}