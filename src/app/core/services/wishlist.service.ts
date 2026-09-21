import { Injectable } from '@angular/core';
import { Product } from '../Models/Product.model';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private storageKey = 'wishlist';

  saveWishlist(products: Product[]): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(products)
    );
  }

  getWishlist(): Product[] {
    const data = localStorage.getItem(this.storageKey);

    return data ? JSON.parse(data) : [];
  }

  clearWishlist(): void {
    localStorage.removeItem(this.storageKey);
  }
}