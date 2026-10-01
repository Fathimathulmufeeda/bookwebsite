import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs';
import emailjs from '@emailjs/browser';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/Models/Product.model';

import { addToCart, loadCart, loadCartSuccess } from '../../../store/cart/cart.action';
import { addToWishlist, loadWishlist } from '../../../store/wishlist/wishlist.action';

import {
  NAME_PATTERN,
  PASSWORD_PATTERN,
  passwordsMatchValidator,
  passwordRuleStatus
} from '../../../shared/validators/custom-validators';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, CommonModule, RouterLink],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {

  private authService = inject(AuthService);
  private router = inject(Router);
  private location = inject(Location);
  private toast = inject(ToastService);
  private store = inject(Store);
  private productService = inject(ProductService);
  private actions$ = inject(Actions);

  /** Which form is currently showing. Defaults based on which URL the
   *  page was first opened with, so a direct link to /register still
   *  lands on the sign-up form, and /login lands on sign-in — but
   *  switching between them afterwards is instant, no page reload. */
  mode: AuthMode = this.router.url.startsWith('/register') ? 'register' : 'login';

  switchMode(mode: AuthMode): void {
    this.mode = mode;
    this.error = '';
    this.submitError = '';
    // Keep the address bar in sync without triggering a real navigation
    // (which would re-run guards/resolvers and reset component state).
    this.location.replaceState(mode === 'login' ? '/login' : '/register');
  }

  // ===========================================================
  // LOGIN
  // ===========================================================

  error = '';
  submitting = false;
  showLoginPassword = false;

  loginForm = new FormGroup({

    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),

    password: new FormControl('', [
      Validators.required
    ])

  });

  toggleLoginPasswordVisibility(): void {
    this.showLoginPassword = !this.showLoginPassword;
  }

  private handlePendingAction(): void {

    const pendingAction = this.authService.getPendingAction();

    if (!pendingAction) {
      this.router.navigate(['/home']);
      return;
    }

    this.productService.getProductById(pendingAction.productId).subscribe({

      next: (product: Product) => {

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
          this.toast.success(`${product.title} added to cart.`);
          this.router.navigate(['/home']);
        }

        else if (pendingAction.type === 'wishlist') {

          this.store.dispatch(
            addToWishlist({
              product: product
            })
          );

          this.authService.clearPendingAction();
          this.toast.success(`${product.title} added to wishlist.`);
          this.router.navigate(['/home']);
        }

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
        this.toast.error('We could not complete your previous action.');
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

    const email = this.loginForm.controls.email.value!.trim().toLowerCase();
    const password = this.loginForm.controls.password.value!;

    this.authService.login(email, password).subscribe({

      next: (user) => {

        this.submitting = false;

        this.toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);

        this.actions$.pipe(
          ofType(loadCartSuccess),
          take(1)
        ).subscribe(() => {
          this.handlePendingAction();
        });

        this.store.dispatch(loadCart());
        this.store.dispatch(loadWishlist());
      },

      error: (err: Error) => {

        this.submitting = false;

        switch (err.message) {

          case 'NO_ACCOUNT':
            this.error = 'No account found with this email. Please check your email or register a new account.';
            break;

          case 'WRONG_PASSWORD':
            this.error = 'Incorrect password. Please try again.';
            break;

          default:
            this.error = 'We could not sign you in right now. Please check your connection and try again.';
        }

      }

    });

  }

  // ===========================================================
  // REGISTER (with email OTP verification)
  // ===========================================================

  submitError = '';
  showRegisterPassword = false;
  showConfirmPassword = false;

  otpSent = false;
  generatedOtp = '';
  enteredOtp = '';

  otpTimer = 0;
  otpExpiresAt = 0;

  private otpInterval?: ReturnType<typeof setInterval>;

  registerForm = new FormGroup({

    name: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(NAME_PATTERN)
    ]),

    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),

    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(PASSWORD_PATTERN)
    ]),

    confirmPassword: new FormControl('', [
      Validators.required
    ])

  }, { validators: passwordsMatchValidator('password', 'confirmPassword') });

  get passwordRules() {
    return passwordRuleStatus(this.registerForm.controls.password.value);
  }

  toggleRegisterPasswordVisibility(): void {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register(otpVerified = false): void {

    this.submitError = '';

    if (!otpVerified) {
      return;
    }

    if (this.registerForm.invalid || this.submitting) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const user = {
      name: this.registerForm.controls.name.value!.trim(),
      email: this.registerForm.controls.email.value!.trim().toLowerCase(),
      password: this.registerForm.controls.password.value!,
      role: 'user' as const
    };

    this.authService.register(user).subscribe({
      next: () => {
        this.submitting = false;
        this.toast.success('Account created successfully! Please sign in.');
        this.switchMode('login');
      },
      error: (error: Error) => {

        this.submitting = false;

        if (error.message === 'EMAIL_EXISTS') {
          this.submitError = 'An account with this email already exists. Try signing in instead.';
        } else {
          this.submitError = 'Something went wrong while creating your account. Please try again.';
        }
      }
    });
  }

  sendOtp(): void {

    this.submitError = '';

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const email = this.registerForm.controls.email.value!.trim().toLowerCase();
    const name = this.registerForm.controls.name.value!.trim();

    this.generatedOtp = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const templateParams = {
      email: email,
      name: name,
      otp: this.generatedOtp
    };

    emailjs.send(
      'service_snnbzpm',
      'template_jwjbdak',
      templateParams,
      {
        publicKey: '-GreLdHC2wgW-xls9'
      }
    )
    .then(() => {

      this.otpSent = true;
      this.otpTimer = 120;
      this.otpExpiresAt = Date.now() + 120000;
      this.startOtpTimer();
      this.toast.success('OTP sent to your email.');

    })
    .catch(() => {
      this.submitError = 'Unable to send OTP. Please check your email and try again.';
    });
  }

  private startOtpTimer(): void {

    if (this.otpInterval) {
      clearInterval(this.otpInterval);
    }

    this.otpInterval = setInterval(() => {

      const remaining = this.otpExpiresAt - Date.now();

      if (remaining <= 0) {
        this.otpTimer = 0;
        clearInterval(this.otpInterval);
        this.otpInterval = undefined;
        return;
      }

      this.otpTimer = Math.ceil(remaining / 1000);

    }, 1000);
  }

  verifyOtp(): void {

    this.submitError = '';

    if (Date.now() > this.otpExpiresAt) {
      this.otpTimer = 0;
      this.submitError = 'OTP has expired. Please resend a new OTP.';
      return;
    }

    if (this.enteredOtp !== this.generatedOtp) {
      this.submitError = 'Invalid OTP. Please enter the correct OTP.';
      return;
    }

    this.register(true);
  }
}