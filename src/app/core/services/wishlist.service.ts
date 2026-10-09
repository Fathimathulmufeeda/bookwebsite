import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, switchMap, throwError } from 'rxjs';

import { Product } from '../Models/Product.model';
import { AuthService } from './auth.service';

interface WishlistRecord {
  id: string;
  userId: string;
  productId: number;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = 'http://localhost:3000/wishlist';
  private productsUrl = 'http://localhost:3000/products';

  readonly MAX_WISHLIST_PRODUCTS = 8;

isWishlistFull(products: Product[]): boolean {
  return products.length >= this.MAX_WISHLIST_PRODUCTS;
}

  private getUserId(): string | null {
    const user = this.authService.getCurrentUser();

    if (!user) {
      return null;
    }

    return String(user.id);
  }

  saveWishlist(products: Product[]): Observable<void> {

    const userId = this.getUserId();

    if (!userId) {
      return of(void 0);
    }
    if (products.length > this.MAX_WISHLIST_PRODUCTS) {
      return throwError(
        () => new Error('Only 8 products are allowed in the wishlist.')
      );
    }

    return this.http
      .get<WishlistRecord[]>(
        `${this.apiUrl}?userId=${encodeURIComponent(userId)}`
      )
      .pipe(

        switchMap(existingRecords => {

          const currentProductIds = new Set(
            products.map(product => product.id)
          );

          // Delete products that are no longer in wishlist
          const recordsToDelete = existingRecords.filter(
            record => !currentProductIds.has(record.productId)
          );

          const deleteRequests = recordsToDelete.map(record =>
            this.http.delete<void>(
              `${this.apiUrl}/${encodeURIComponent(record.id)}`
            )
          );

          // Add new products
          const saveRequests = products.map(product => {

            const existing = existingRecords.find(
              record => record.productId === product.id
            );

            const record: WishlistRecord = {
              id: existing?.id ?? `${userId}_${product.id}`,
              userId,
              productId: product.id
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

  getWishlist(): Observable<Product[]> {

    const userId = this.getUserId();

    if (!userId) {
      return of([]);
    }

    return forkJoin({

      wishlistRecords: this.http.get<WishlistRecord[]>(
        `${this.apiUrl}?userId=${encodeURIComponent(userId)}`
      ),

      products: this.http.get<Product[]>(
        this.productsUrl
      )

    }).pipe(

      map(({ wishlistRecords, products }) => {

        return wishlistRecords
          .map(record => {

            const product = products.find(
              p => p.id === record.productId
            );

            if (!product) {
              return null;
            }

            return product;
          })
          .filter(
            (product): product is Product => product !== null
          );
      })
    );
  }

  clearWishlist(): Observable<void> {
    return this.saveWishlist([]);
  }
}