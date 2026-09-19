import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { loadProducts } from '../../store/product/products.action';
import { selectProducts, selectProductsError, selectProductsLoading } from '../../store/product/products.selectors';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
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

}