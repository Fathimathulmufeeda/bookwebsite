import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { loadProducts } from '../../store/product/products.action';
import { selectProducts, selectProductsError, selectProductsLoading } from '../../store/product/products.selectors';
import { CommonModule } from '@angular/common';
import { Product } from '../../core/Models/Product.model';
import { addToCart } from '../../store/cart/cart.action';
import { selectCartCount, selectCartItems } from '../../store/cart/cart.selectors';

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

}