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
}
