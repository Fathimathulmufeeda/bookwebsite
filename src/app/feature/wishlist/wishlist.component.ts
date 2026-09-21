import { Component, inject, OnInit } from '@angular/core';
import { selectWishlistProducts } from '../../store/wishlist/wishlist.selectors';
import { Store } from '@ngrx/store';
import { loadWishlist, removeFromWishlist } from '../../store/wishlist/wishlist.action';
import { CommonModule } from '@angular/common';
import { addToCart } from '../../store/cart/cart.action';
import { Product } from '../../core/Models/Product.model';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './wishlist.component.html',
  styleUrl: './wishlist.component.css'
})
export class WishlistComponent implements OnInit {

  private store = inject(Store);

  wishlistProducts$ = this.store.select(selectWishlistProducts);

  ngOnInit(): void {
    this.store.dispatch(loadWishlist());
  }

  removeFromWishlist(productId: number): void {
    this.store.dispatch(
      removeFromWishlist({ productId })
    );
  }

  moveToCart(product: Product): void {
    this.store.dispatch(
      addToCart({
        item: {
          product: product,
          quantity: 1
        }
      })
    );

    this.store.dispatch(
      removeFromWishlist({
        productId: product.id
      })
    );
  }
}