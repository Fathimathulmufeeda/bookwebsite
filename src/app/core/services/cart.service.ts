
import { Injectable, inject } from '@angular/core';
import { CartItem } from '../Models/cart-item.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private authService = inject(AuthService);

  private getStorageKey(): string | null {

    const user = this.authService.getCurrentUser();

    if (!user) {
      return null;
    }

    return `cart_${user.id}`;
  }

  saveCart(items: CartItem[]): void {

    const storageKey = this.getStorageKey();

    if (!storageKey || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(
      storageKey,
      JSON.stringify(items)
    );
  }

  getCart(): CartItem[] {

    const storageKey = this.getStorageKey();

    if (!storageKey || typeof localStorage === 'undefined') {
      return [];
    }

    const data = localStorage.getItem(storageKey);

    return data ? JSON.parse(data) : [];
  }

  clearCart(): void {

    const storageKey = this.getStorageKey();

    if (!storageKey || typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(storageKey);
  }
}
