import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Store } from '@ngrx/store';

import { selectCartCount } from '../../../store/cart/cart.selectors';
import { selectWishlistCount } from '../../../store/wishlist/wishlist.selectors';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './header.component.html'
})
export class HeaderComponent {

  private router = inject(Router);
  private store = inject(Store);
  private authService = inject(AuthService);

  cartCount$ = this.store.select(selectCartCount);
  wishlistCount$ = this.store.select(selectWishlistCount);

  currentUser = this.authService.getCurrentUser();

  searchOpen = false;
  searchTerm = '';
  mobileMenuOpen = false;
  profileMenuOpen = false;

  // Fragment-based nav links are highlighted manually since routerLinkActive
  // does not track URL fragments the way it tracks path segments.
  activeFragment = '';

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

  logout(): void {
    this.profileMenuOpen = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}