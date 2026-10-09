import { Component, inject, OnInit } from '@angular/core';
import { selectWishlistProducts } from '../../store/wishlist/wishlist.selectors';
import { Store } from '@ngrx/store';
import { loadWishlist, removeFromWishlist } from '../../store/wishlist/wishlist.action';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { addToCart } from '../../store/cart/cart.action';
import { selectCartItems } from '../../store/cart/cart.selectors';
import { Product } from '../../core/Models/Product.model';

import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ToastService } from '../../shared/services/toast.service';
import { WishlistService } from '../../core/services/wishlist.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {

  private store = inject(Store);
  private router = inject(Router);
  private toast = inject(ToastService);
  private wishlistService = inject(WishlistService);
private confirmDialog = inject(ConfirmDialogService);

  wishlistProducts$ = this.store.select(selectWishlistProducts);

  private cartProductIds = new Set<number>();

  ngOnInit(): void {
    this.store.dispatch(loadWishlist());

    this.store.select(selectCartItems).subscribe(items => {
      this.cartProductIds = new Set(items.map(i => i.product.id));
    });
  }

  isInCart(product: Product): boolean {
    return this.cartProductIds.has(product.id);
  }

  removeFromWishlist(product: Product): void {
    this.store.dispatch(removeFromWishlist({ productId: product.id }));
    this.toast.info(`"${product.title}" removed from wishlist.`);
  }

  moveToCart(product: Product): void {

    if (product.stock <= 0) {
      this.toast.error(`"${product.title}" is currently out of stock.`);
      return;
    }

    if (this.isInCart(product)) {
      this.toast.info(`"${product.title}" is already in your cart.`);
      return;
    }

    this.store.dispatch(
      addToCart({
        item: {
          product: product,
          quantity: 1
        }
      })
    );

    this.toast.success(`"${product.title}" added to cart.`);
  }

  goToProduct(product: Product): void {
    this.router.navigate(['/product', product.id]);
  }
  async clearWishlist(): Promise<void> {

    const confirmed = await this.confirmDialog.confirm({
      title: 'Clear Wishlist',
      message: 'Are you sure you want to remove all books from your wishlist? This action cannot be undone.',
      confirmText: 'Clear Wishlist',
      cancelText: 'Keep Wishlist',
      danger: true
    });
  
    if (!confirmed) {
      return;
    }
  
    this.wishlistService.clearWishlist().subscribe({
  
      error: () => {
        this.toast.error('Failed to clear your wishlist. Please try again.');
      },
  
      complete: () => {
        this.store.dispatch(loadWishlist());
        this.toast.success('Your wishlist has been cleared.');
      }
  
    });
  }
}
