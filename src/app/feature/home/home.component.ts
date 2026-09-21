import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';

import { loadProducts } from '../../store/product/products.action';
import {
  selectProducts,
  selectProductsError,
  selectProductsLoading
} from '../../store/product/products.selectors';

import { Product } from '../../core/Models/Product.model';

import { addToCart, loadCart } from '../../store/cart/cart.action';
import { selectCartCount } from '../../store/cart/cart.selectors';
import { addToWishlist } from '../../store/wishlist/wishlist.action';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule,RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  private authService = inject(AuthService);
  private router = inject(Router);
  private store = inject(Store);

  products$ = this.store.select(selectProducts);
  loading$ = this.store.select(selectProductsLoading);
  error$ = this.store.select(selectProductsError);
  cartCount$ = this.store.select(selectCartCount);

  ngOnInit(): void {
    this.loadProducts();
    this.store.dispatch(loadCart());
  }

  loadProducts(): void {
    this.store.dispatch(loadProducts());
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  addToCart(product: Product): void {
    this.store.dispatch(
      addToCart({
        item: {
          product: product,
          quantity: 1
        }
      })
    );
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  addToWishlist(product: Product): void {
    this.store.dispatch(
      addToWishlist({ product })
    );
    
  }
  buyNow(product: Product): void {
    this.router.navigate(['/checkout'], {
      state: {
        buyNowProduct: product
      }
    });
  }


}