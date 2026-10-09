import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { FormsModule } from '@angular/forms';

import { loadProducts } from '../../store/product/products.action';
import {
  selectProducts,
  selectProductsError,
  selectProductsLoading
} from '../../store/product/products.selectors';

import { Product } from '../../core/Models/Product.model';

import { addToCart, loadCart } from '../../store/cart/cart.action';
import { selectCartItems } from '../../store/cart/cart.selectors';

import { addToWishlist, removeFromWishlist } from '../../store/wishlist/wishlist.action';
import { selectWishlistProducts } from '../../store/wishlist/wishlist.selectors';

import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ToastService } from '../../shared/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { normalizeCategory } from '../../shared/utils/category.util';
import { take } from 'rxjs';
import { MAX_WISHLIST_PRODUCTS } from '../../store/wishlist/wishlist.constant';


type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating';

const PAGE_SIZE = 12;


@Component({
  selector: 'app-books',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HeaderComponent, FooterComponent],
  templateUrl: './books.component.html',
  styleUrl: './books.component.css'
})
export class BooksComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private store = inject(Store);
  private toast = inject(ToastService);
  

  // The full set of categories offered for browsing. Kept in one place so
  // the filter chips and the query-param handling always agree.
  readonly categories = ['Fiction', 'Non Fiction', 'Self Help', 'Romance', 'Children', 'Classics'];

  products: Product[] = [];

  selectedCategory: string | null = null;
  searchTerm = '';
  sortBy: SortOption = 'relevance';

  readonly pageSize = PAGE_SIZE;
  currentPage = 1;

  products$ = this.store.select(selectProducts);
  loading$ = this.store.select(selectProductsLoading);
  error$ = this.store.select(selectProductsError);

  private cartProductIds = new Set<number>();
  private wishlistProductIds = new Set<number>();
  private authService = inject(AuthService);

  get filteredProducts(): Product[] {

    let result = this.products;

    if (this.selectedCategory) {
      const target = normalizeCategory(this.selectedCategory);
      result = result.filter(p => normalizeCategory(p.category) === target);
    }

    const term = this.searchTerm.trim().toLowerCase();

    if (term) {
      result = result.filter(
        p => p.title.toLowerCase().includes(term) || p.author.toLowerCase().includes(term)
      );
    }

    const sorted = [...result];

    switch (this.sortBy) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        break;
      default:
        break;
    }

    return sorted;
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredProducts.length / this.pageSize));
  }

  /** The slice of filteredProducts actually shown on the current page. */
  get paginatedProducts(): Product[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  /** A short, windowed list of page numbers to render as buttons, e.g.
   *  [3, 4, 5, 6, 7] rather than every page when there are fifty of them. */
  get pageNumbers(): number[] {

    const total = this.totalPages;
    const windowSize = 5;

    let start = Math.max(1, this.currentPage - Math.floor(windowSize / 2));
    let end = Math.min(total, start + windowSize - 1);

    start = Math.max(1, end - windowSize + 1);

    const pages: number[] = [];

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  goToPage(page: number): void {

    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.scrollToResultsTop();
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  private scrollToResultsTop(): void {
    document.getElementById('books-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /** Any change to what's being filtered/sorted invalidates the current
   *  page — e.g. page 4 of "all books" may not exist once filtered down
   *  to 6 results, so every filter change snaps back to page 1. */
  private resetToFirstPage(): void {
    this.currentPage = 1;
  }

  onSearchTermChange(value: string): void {
    this.searchTerm = value;
    this.resetToFirstPage();
  }

  onSortChange(value: SortOption): void {
    this.sortBy = value;
    this.resetToFirstPage();
  }

  ngOnInit(): void {

    this.loadProducts();

    if (this.authService.isLoggedIn()) {
      this.store.dispatch(loadCart());
    }

    this.products$.subscribe(products => {
      this.products = products;
    });

    this.store.select(selectCartItems).subscribe(items => {
      this.cartProductIds = new Set(items.map(i => i.product.id));
    });

    this.store.select(selectWishlistProducts).subscribe(products => {
      this.wishlistProductIds = new Set(products.map(p => p.id));
    });

    this.route.queryParamMap.subscribe(params => {
      this.selectedCategory = params.get('category');
      this.searchTerm = params.get('q') ?? '';
      this.resetToFirstPage();
    });
  }

  loadProducts(): void {
    this.store.dispatch(loadProducts());
  }

  isCategorySelected(category: string): boolean {
    return !!this.selectedCategory && normalizeCategory(this.selectedCategory) === normalizeCategory(category);
  }

  selectCategory(category: string | null): void {

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category || null },
      queryParamsHandling: 'merge'
    });
  }

  clearAll(): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  isInCart(product: Product): boolean {
    return this.cartProductIds.has(product.id);
  }

  isWishlisted(product: Product): boolean {
    return this.wishlistProductIds.has(product.id);
  }

  hasValidPrice(product: Product): boolean {
    return typeof product.price === 'number' && product.price > 0 && !isNaN(product.price);
  }

  hasDiscount(product: Product): boolean {
    return this.hasValidPrice(product) && product.mrp > product.price;
  }

  goToProduct(product: Product): void {
    this.router.navigate(['/product', product.id]);
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
      this.toast.error('This item is temporarily unavailable for purchase.');
      return;
    }
  
    if (product.stock <= 0) {
      this.toast.error(`${product.title} is currently out of stock.`);
      return;
    }
  
    if (this.isInCart(product)) {
      this.toast.info(`${product.title} is already in your cart.`);
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
  
    this.toast.success(`${product.title} added to cart.`);
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
        removeFromWishlist({ productId: product.id })
      );
  
      this.toast.info(`${product.title} removed from wishlist.`);
      return;
    }
  
    this.store.select(selectWishlistProducts).pipe(
      take(1)
    ).subscribe(products => {
      if (products.some(item => item.id === product.id)) {
        return;
      }
  
      if (products.length >= MAX_WISHLIST_PRODUCTS) {
        this.toast.warning(
          `Only ${MAX_WISHLIST_PRODUCTS} books are allowed in the wishlist.`
        );
        return;
      }
  
      this.store.dispatch(addToWishlist({ product }));
      this.toast.success(`${product.title} added to wishlist.`);
    });
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
      this.toast.error(`${product.title} is currently out of stock.`);
      return;
    }
  
    if (!this.isInCart(product)) {
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