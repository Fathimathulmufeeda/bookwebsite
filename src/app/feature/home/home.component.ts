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

import {
  addToCart,
  clearCart,
  loadCart
} from '../../store/cart/cart.action';

import { selectCartCount, selectCartItems } from '../../store/cart/cart.selectors';

import { addToWishlist, clearWishlist, removeFromWishlist } from '../../store/wishlist/wishlist.action';
import { selectWishlistProducts } from '../../store/wishlist/wishlist.selectors';

import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ToastService } from '../../shared/services/toast.service';
import { MAX_CART_PRODUCTS } from '../../store/cart/cart.constant';



const BESTSELLER_MIN_RATING = 4.5;
const BESTSELLER_MIN_REVIEWS = 500;
const BESTSELLER_LIMIT = 8;


@Component({
  selector: 'app-home',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    HeaderComponent, FooterComponent
  ],

  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  maxCartProducts = MAX_CART_PRODUCTS;

 
  get bestsellingProducts(): Product[] {

    const qualifying = this.products.filter(
      p => p.rating >= BESTSELLER_MIN_RATING && p.reviewCount >= BESTSELLER_MIN_REVIEWS
    );

    const pool = qualifying.length > 0 ? qualifying : this.products;

    return [...pool]
      .sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount)
      .slice(0, BESTSELLER_LIMIT);
  }

  
  scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }


  goToBooks(category?: string): void {
    this.router.navigate(['/books'], category ? { queryParams: { category } } : {});
  }

  private authService = inject(AuthService);
  private router = inject(Router);
  private store = inject(Store);
  private toast = inject(ToastService);

  products$ = this.store.select(selectProducts);

  loading$ = this.store.select(selectProductsLoading);

  error$ = this.store.select(selectProductsError);

  cartCount$ = this.store.select(selectCartCount);

  cartItems$ = this.store.select(selectCartItems);

  wishlistProducts$ = this.store.select(selectWishlistProducts);

 
  private cartProductIds = new Set<number>();
  private wishlistProductIds = new Set<number>();

  ngOnInit(): void {

    this.loadProducts();

    if (this.authService.isLoggedIn()) {
      this.store.dispatch(loadCart());
    }
  
    if (!this.authService.isLoggedIn()) {
      this.store.dispatch(clearCart());
      this.store.dispatch(clearWishlist());
    }
  
    this.products$.subscribe(products => {
      this.products = products;
    });
  
    this.cartItems$.subscribe(items => {
      this.cartProductIds = new Set(
        items.map(i => i.product.id)
      );
    });
  
    this.wishlistProducts$.subscribe(products => {
      this.wishlistProductIds = new Set(
        products.map(p => p.id)
      );
    });
  }


  loadProducts(): void {

    this.store.dispatch(
      loadProducts()
    );
  }
  logout(): void {

    this.authService.logout();

    this.router.navigate(['/login']);

  }

 
  hasValidPrice(product: Product): boolean {
    return typeof product.price === 'number' && product.price > 0 && !isNaN(product.price);
  }

  hasDiscount(product: Product): boolean {
    return this.hasValidPrice(product) && product.mrp > product.price;
  }

  isInCart(product: Product): boolean {
    return this.cartProductIds.has(product.id);
  }

  isWishlisted(product: Product): boolean {
    return this.wishlistProductIds.has(product.id);
  }

  addToCart(product: Product, event?: Event): void {

    event?.stopPropagation();
  
    if (!this.authService.isLoggedIn()) {
  
      this.authService.savePendingAction({
        type: 'cart',
        productId: product.id,
        quantity: 1
      });
  
      this.router.navigate(['/login']);
  
      return;
    }
  
    if (!this.hasValidPrice(product)) {
      this.toast.error(
        'This item is temporarily unavailable for purchase.'
      );
      return;
    }
  
    if (product.stock <= 0) {
      this.toast.error(
        `${product.title} is currently out of stock.`
      );
      return;
    }
  
    if (this.isInCart(product)) {
      this.toast.info(
        `${product.title} is already in your cart.`
      );
      return;
    }
    console.log('Cart products:', this.cartProductIds.size);
console.log('Cart IDs:', [...this.cartProductIds]);
console.log('Max products:', this.maxCartProducts);
    if (this.cartProductIds.size >= this.maxCartProducts) {
      this.toast.warning(
        `You can add a maximum of ${this.maxCartProducts} different books to your cart.`
      );
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
  
    this.toast.success(
      `${product.title} added to cart.`
    );
  }


  goToCart(): void {

    this.router.navigate(['/cart']);

  }

  goToProduct(product: Product): void {
    this.router.navigate(['/product', product.id]);
  }


  toggleWishlist(product: Product, event?: Event): void {

    event?.stopPropagation();
  
    if (!this.authService.isLoggedIn()) {
  
      this.authService.savePendingAction({
        type: 'wishlist',
        productId: product.id,
        quantity: 1
      });
  
      this.router.navigate(['/login']);
  
      return;
    }
  
    if (this.isWishlisted(product)) {
  
      this.store.dispatch(
        removeFromWishlist({
          productId: product.id
        })
      );
  
      this.toast.info(
        `${product.title} removed from wishlist.`
      );
  
    } else {
  
      this.store.dispatch(
        addToWishlist({
          product
        })
      );
  
      this.toast.success(
        `${product.title} added to wishlist.`
      );
    }
  }


  buyNow(product: Product, event?: Event): void {

    event?.stopPropagation();
  
    if (!this.authService.isLoggedIn()) {
  
      this.authService.savePendingAction({
        type: 'buyNow',
        productId: product.id,
        quantity: 1
      });
  
      this.router.navigate(['/login']);
  
      return;
    }
  
    if (product.stock <= 0) {
      this.toast.error(
        `${product.title} is currently out of stock.`
      );
      return;
    }
  
    if (!this.isInCart(product)) {
      

      if (this.cartProductIds.size >= this.maxCartProducts) {
        this.toast.warning(
          `You can add a maximum of ${this.maxCartProducts} different books to your cart.`
        );
        return;
      }
    
      this.store.dispatch(
        addToCart({
          item: {
            product,
            quantity: 1
          }
        })
      );
    }
  
    this.router.navigate(['/checkout']);
  }
}