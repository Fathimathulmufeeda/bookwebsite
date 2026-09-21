import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectCartItems, selectCartTotal } from '../../store/cart/cart.selectors';
import { CommonModule } from '@angular/common';
import { decreaseQuantity, increaseQuantity, loadCart, removeFromCart } from '../../store/cart/cart.action';
import { Router, RouterLink } from '@angular/router';
import { MAX_BOOK_QUANTITY } from '../../store/cart/cart.constant'; 

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent {

  readonly maxBookQuantity = MAX_BOOK_QUANTITY;

  private store = inject(Store);
  private router = inject(Router);
  cartItems$ = this.store.select(selectCartItems);
  cartTotal$ = this.store.select(selectCartTotal);

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

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
  ngOnInit(): void {
    this.store.dispatch(loadCart());
  }
}
