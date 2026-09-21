import { Injectable } from '@angular/core';
import { CartItem } from '../Models/cart-item.model';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private storageKey = 'cart';

  saveCart(items: CartItem[]): void {
    localStorage.setItem(
      this.storageKey,
      JSON.stringify(items)
    );
  }

  getCart(): CartItem[] {
    const data = localStorage.getItem(this.storageKey);

    return data ? JSON.parse(data) : [];
  }

  clearCart(): void {
    localStorage.removeItem(this.storageKey);
  }
}