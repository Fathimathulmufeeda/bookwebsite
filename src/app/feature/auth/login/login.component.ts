
import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

import { Store } from '@ngrx/store';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/Models/Product.model';

import { addToCart } from '../../../store/cart/cart.action';

import {
  addToWishlist,
  loadWishlist
} from '../../../store/wishlist/wishlist.action';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private store = inject(Store);
  private productService = inject(ProductService);

  error = '';
  submitting = false;
  showPassword = false;


  loginForm = new FormGroup({

    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),

    password: new FormControl('', [
      Validators.required
    ])

  });


  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }


  private handlePendingAction(): void {

    const pendingAction = this.authService.getPendingAction();

    /*
     * No pending action.
     * This was a normal login.
     */
    if (!pendingAction) {
      this.router.navigate(['/home']);
      return;
    }


    /*
     * There is a pending action.
     * Get the product and complete the action automatically.
     */
    this.productService.getProductById(pendingAction.productId).subscribe({

      next: (product: Product) => {

        /*
         * ADD TO CART
         */
        if (pendingAction.type === 'cart') {

          this.store.dispatch(
            addToCart({
              item: {
                product: product,
                quantity: pendingAction.quantity
              }
            })
          );

          this.authService.clearPendingAction();

          this.toast.success(
            `${product.title} added to cart.`
          );

          this.router.navigate(['/home']);
        }


        /*
         * ADD TO WISHLIST
         */
        else if (pendingAction.type === 'wishlist') {

          this.store.dispatch(
            addToWishlist({
              product: product
            })
          );

          this.authService.clearPendingAction();

          this.toast.success(
            `${product.title} added to wishlist.`
          );

          this.router.navigate(['/home']);
        }


        /*
         * BUY NOW
         */
        else if (pendingAction.type === 'buyNow') {

          this.store.dispatch(
            addToCart({
              item: {
                product: product,
                quantity: pendingAction.quantity
              }
            })
          );

          this.authService.clearPendingAction();

          this.router.navigate(['/checkout']);
        }

      },

      error: () => {

        this.authService.clearPendingAction();

        this.toast.error(
          'We could not complete your previous action.'
        );

        this.router.navigate(['/home']);
      }

    });
  }


  login(): void {

    this.error = '';

    if (this.loginForm.invalid || this.submitting) {

      this.loginForm.markAllAsTouched();

      return;
    }


    this.submitting = true;

    const email =
      this.loginForm.controls.email.value!
        .trim()
        .toLowerCase();

    const password =
      this.loginForm.controls.password.value!;


    this.authService.login(email, password).subscribe({

      next: (user) => {

        /*
         * Login is successful.
         * AuthService has already saved the current user.
         */

        this.submitting = false;

        this.toast.success(
          `Welcome back, ${user.name.split(' ')[0]}!`
        );


        /*
         * IMPORTANT:
         *
         * Load this user's wishlist.
         *
         * WishlistService now uses:
         *
         * wishlist_<userId>
         *
         * instead of one shared "wishlist" key.
         */
        this.store.dispatch(loadWishlist());


        /*
         * Now continue the action that
         * the guest originally requested.
         */
        this.handlePendingAction();

      },


      error: (err: Error) => {

        this.submitting = false;

        switch (err.message) {

          case 'NO_ACCOUNT':

            this.error =
              'No account found with this email. Please check your email or register a new account.';

            break;


          case 'WRONG_PASSWORD':

            this.error =
              'Incorrect password. Please try again.';

            break;


          default:

            this.error =
              'We could not sign you in right now. Please check your connection and try again.';

        }

      }

    });

  }

}