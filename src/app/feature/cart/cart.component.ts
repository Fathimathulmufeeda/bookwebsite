import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectCartItems, selectCartTotal } from '../../store/cart/cart.selectors';
import { CommonModule } from '@angular/common';
import { decreaseQuantity, increaseQuantity, removeFromCart } from '../../store/cart/cart.action';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {
  private store = inject(Store);
  cartItems$ = this.store.select(selectCartItems);
  cartTotal$ = this.store.select(selectCartTotal);

  increaseQuantity(productId: number): void {
    this.store.dispatch(
      increaseQuantity({ productId })
    );
  }

  onDecreaseQuantity(productId: number): void {
    this.store.dispatch(
      decreaseQuantity({ productId })
    );
  }
  onRemoveFromCart(productId: number): void {
    this.store.dispatch(
      removeFromCart({ productId })
    );
  }
}
