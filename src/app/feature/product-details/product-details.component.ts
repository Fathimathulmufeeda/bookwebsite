import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, map } from 'rxjs';

import { Product } from '../../core/Models/Product.model';
import { ProductService } from '../../core/services/product.service';
import { ToastService } from '../../shared/services/toast.service';

import { addToCart } from '../../store/cart/cart.action';
import { selectCartItems } from '../../store/cart/cart.selectors';
import { MAX_BOOK_QUANTITY } from '../../store/cart/cart.constant';

import { addToWishlist, removeFromWishlist } from '../../store/wishlist/wishlist.action';
import { selectWishlistProducts } from '../../store/wishlist/wishlist.selectors';

import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private store = inject(Store);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  product: Product | null = null;
  loading = true;
  notFound = false;

  selectedImageIndex = 0;
  quantity = 1;

  // Zoom lens state
  isZooming = false;
  zoomBackgroundPosition = '0% 0%';

  maxQuantity = MAX_BOOK_QUANTITY;

  alreadyInCart = false;
  currentCartQuantity = 0;
  isWishlisted = false;

  wishlistProducts$: Observable<Product[]> = this.store.select(selectWishlistProducts);

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      const id = Number(params.get('id'));

      if (!id) {
        this.notFound = true;
        this.loading = false;
        return;
      }

      this.loadProduct(id);
    });
  }

  private loadProduct(id: number): void {

    this.loading = true;
    this.notFound = false;
    this.selectedImageIndex = 0;
    this.quantity = 1;

    this.productService.getProductById(id).subscribe({
      next: (product) => {
        this.product = product;
        this.loading = false;
        this.watchCartStatus(id);
        this.watchWishlistStatus(id);
      },
      error: () => {
        this.loading = false;
        this.notFound = true;
      }
    });
  }

  private watchCartStatus(productId: number): void {
    this.store.select(selectCartItems).pipe(
      map(items => items.find(i => i.product.id === productId))
    ).subscribe(item => {
      this.alreadyInCart = !!item;
      this.currentCartQuantity = item?.quantity ?? 0;
    });
  }

  private watchWishlistStatus(productId: number): void {
    this.wishlistProducts$.pipe(
      map(products => products.some(p => p.id === productId))
    ).subscribe(isIn => this.isWishlisted = isIn);
  }

  get images(): string[] {
    return this.product?.images?.length ? this.product.images : [];
  }

  get remainingStock(): number {
    return this.product ? Math.max(this.product.stock - this.currentCartQuantity, 0) : 0;
  }

  get effectiveMax(): number {
    if (!this.product) return 1;
    return Math.max(Math.min(this.maxQuantity, this.remainingStock), 0);
  }

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  nextImage(): void {
    if (!this.images.length) return;
    this.selectedImageIndex = (this.selectedImageIndex + 1) % this.images.length;
  }

  prevImage(): void {
    if (!this.images.length) return;
    this.selectedImageIndex = (this.selectedImageIndex - 1 + this.images.length) % this.images.length;
  }

  onMouseMove(event: MouseEvent): void {

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    this.zoomBackgroundPosition = `${x}% ${y}%`;
  }

  onMouseEnter(): void {
    if (this.images.length) {
      this.isZooming = true;
    }
  }

  onMouseLeave(): void {
    this.isZooming = false;
  }

  increaseQty(): void {
    if (this.quantity < this.effectiveMax) {
      this.quantity++;
    } else {
      this.toast.warning(`You can add a maximum of ${this.effectiveMax} of this item.`);
    }
  }

  decreaseQty(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {

    if (!this.product) return;
  
    // Check authentication first
    if (!this.authService.isLoggedIn()) {
      this.authService.savePendingAction({
        type: 'cart',
        productId: this.product.id,
        quantity: this.quantity
      });
    
      this.router.navigate(['/login']);
      return;
    }
  
    if (this.product.stock <= 0) {
      this.toast.error('This book is currently out of stock.');
      return;
    }
  
    if (this.alreadyInCart) {
      this.toast.info(
        `${this.product.title} is already in your cart. Adjust the quantity from your cart.`
      );
      return;
    }
  
    if (this.effectiveMax <= 0) {
      this.toast.warning('No more stock available to add.');
      return;
    }
  
    this.store.dispatch(addToCart({
      item: {
        product: this.product,
        quantity: this.quantity
      }
    }));
  
    this.toast.success(`${this.product.title} added to cart.`);
  }

  buyNow(): void {

    if (!this.product) return;
  
    // Check authentication first
    if (!this.authService.isLoggedIn()) {
      this.authService.savePendingAction({
        type: 'buyNow',
        productId: this.product.id,
        quantity: this.quantity
      });
    
      this.router.navigate(['/login']);
      return;
    }
  
    if (this.product.stock <= 0) {
      this.toast.error('This book is currently out of stock.');
      return;
    }
  
    if (!this.alreadyInCart) {
      this.store.dispatch(addToCart({
        item: {
          product: this.product,
          quantity: this.quantity
        }
      }));
    }
  
    this.router.navigate(['/checkout']);
  }

  toggleWishlist(): void {

    if (!this.product) return;
  
    // Check authentication first
    if (!this.authService.isLoggedIn()) {
      this.authService.savePendingAction({
        type: 'wishlist',
        productId: this.product.id,
        quantity: 1
      });
    
      this.router.navigate(['/login']);
      return;
    }
  
    if (this.isWishlisted) {
      this.store.dispatch(
        removeFromWishlist({
          productId: this.product.id
        })
      );
  
      this.toast.info(`${this.product.title} removed from wishlist.`);
  
    } else {
      this.store.dispatch(
        addToWishlist({
          product: this.product
        })
      );
  
      this.toast.success(`${this.product.title} added to wishlist.`);
    }
  }

  discountAmount(): number {
    if (!this.product) return 0;
    return Math.max(this.product.mrp - this.product.price, 0);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowRight') this.nextImage();
    if (event.key === 'ArrowLeft') this.prevImage();
  }
}
