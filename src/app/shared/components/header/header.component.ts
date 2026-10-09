import { Component, HostListener, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';

import { selectCartCount } from '../../../store/cart/cart.selectors';
import { selectWishlistCount } from '../../../store/wishlist/wishlist.selectors';
import { AuthService } from '../../../core/services/auth.service';
import { clearCart, loadCart } from '../../../store/cart/cart.action';
import { clearWishlist, loadWishlist } from '../../../store/wishlist/wishlist.action';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {
  private router = inject(Router);
  private store = inject(Store);
  private authService = inject(AuthService);
  private confirmDialog = inject(ConfirmDialogService);

  cartCount$ = this.store.select(selectCartCount);
  wishlistCount$ = this.store.select(selectWishlistCount);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.store.dispatch(loadCart());
      this.store.dispatch(loadWishlist());
    }
  }

  searchOpen = false;
  searchTerm = '';
  mobileMenuOpen = false;
  profileMenuOpen = false;

  // Fragment-based nav links are highlighted manually since routerLinkActive
  // does not track URL fragments the way it tracks path segments.
  activeFragment = '';
  get currentUser() {
    return this.authService.getCurrentUser();
  }

  constructor() {
    this.router.events.subscribe(() => {
      this.activeFragment = typeof window !== 'undefined'
        ? (window.location.hash?.replace('#', '') || '')
        : '';
    });
  }

  isFragmentActive(fragment: string): boolean {
    return this.activeFragment === fragment;
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToWishlist(): void {
    this.router.navigate(['/wishlist']);
  }
  goToProfile(): void {
    this.profileMenuOpen = false;
    this.router.navigate(['/profile']);
  }

  goToOrders(): void {
    this.profileMenuOpen = false;
    this.router.navigate(['/order-history']);
  }

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleProfileMenu(): void {
    this.profileMenuOpen = !this.profileMenuOpen;
  }
  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  @HostListener('document:click')
  closeProfileMenu(): void {
    this.profileMenuOpen = false;
  }

  onSearchSubmit(): void {
    const term = this.searchTerm.trim();
    if (!term) return;
    this.router.navigate(['/books'], { queryParams: { q: term } });
    this.searchOpen = false;
    this.searchTerm = '';
  }

  
  async logout(): Promise<void> {
    this.profileMenuOpen = false;
  
    const confirmed = await this.confirmDialog.confirm({
      title: 'Log Out',
      message: 'Are you sure you want to log out of your account?',
      confirmText: 'Log Out',
      cancelText: 'Cancel'
    });
  
    if (!confirmed) {
      return;
    }
  
    this.authService.logout();
  
    this.store.dispatch(clearCart());
    this.store.dispatch(clearWishlist());
  
    await this.router.navigate(['/home']);
  }

}