
import { Injectable, inject } from '@angular/core';
import { Product } from '../Models/Product.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WishlistService {

  private authService = inject(AuthService);

  private getStorageKey(): string | null {
    const user = this.authService.getCurrentUser();

    if (!user) {
      return null;
    }

    return `wishlist_${user.id}`;
  }

  saveWishlist(products: Product[]): void {
    const storageKey = this.getStorageKey();

    if (!storageKey || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify(products)
    );
  }

  getWishlist(): Product[] {
    const storageKey = this.getStorageKey();

    if (!storageKey || typeof localStorage === 'undefined') {
      return [];
    }

    const data = localStorage.getItem(storageKey);

    return data ? JSON.parse(data) : [];
  }

  clearWishlist(): void {
    const storageKey = this.getStorageKey();

    if (!storageKey || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(storageKey);
  }
}