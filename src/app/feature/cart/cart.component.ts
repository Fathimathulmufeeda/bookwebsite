import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';

import {decreaseQuantity,increaseQuantity,loadCart,removeFromCart} from '../../store/cart/cart.action';

import {selectCartItems,selectCartTotal} from '../../store/cart/cart.selectors';

import { MAX_BOOK_QUANTITY } from '../../store/cart/cart.constant';
import { CartItem } from '../../core/Models/cart-item.model';

import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.css'
})
export class CartComponent implements OnInit {

  private store = inject(Store);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  cartItems$ = this.store.select(selectCartItems);
  cartTotal$ = this.store.select(selectCartTotal);

  maxQuantity = MAX_BOOK_QUANTITY;
  ngOnInit(): void {
    this.store.dispatch(loadCart());
  }

  effectiveMax(item: CartItem): number {
    return Math.min(this.maxQuantity, item.product.stock);
  }

  increase(item: CartItem): void {

    const max = this.effectiveMax(item);

    if (item.quantity >= max) {

      if (item.product.stock <= this.maxQuantity) {
        this.toast.warning(`Only ${item.product.stock} copies of "${item.product.title}" are in stock.`);
      } else {
        this.toast.warning(`You can add a maximum of ${this.maxQuantity} copies of "${item.product.title}" per order.`);
      }

      return;
    }

    this.store.dispatch(increaseQuantity({ productId: item.product.id }));
  }

  decrease(item: CartItem): void {

    if (item.quantity <= 1) {
      this.remove(item);
      return;
    }

    this.store.dispatch(decreaseQuantity({ productId: item.product.id }));
  }

  async remove(item: CartItem): Promise<void> {

    const confirmed = await this.confirmDialog.confirm({
      title: 'Remove item?',
      message: `Remove "${item.product.title}" from your cart?`,
      confirmText: 'Remove',
      cancelText: 'Keep it',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    this.store.dispatch(removeFromCart({ productId: item.product.id }));
    this.toast.success(`"${item.product.title}" removed from cart.`);
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}
