import { Component, inject, OnDestroy, PLATFORM_ID } from '@angular/core';

import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { CommonModule, Location, isPlatformBrowser } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { Store } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { take } from 'rxjs';

import emailjs from '@emailjs/browser';

import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/Models/Product.model';

import {
  addToCart,
  loadCart,
  loadCartSuccess
} from '../../../store/cart/cart.action';

import {
  addToWishlist,
  loadWishlist
} from '../../../store/wishlist/wishlist.action';

import {
  NAME_PATTERN,
  PASSWORD_PATTERN,
  passwordsMatchValidator,
  passwordRuleStatus
} from '../../../shared/validators/custom-validators';


type AuthMode = 'login' | 'register' | 'otp';


@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    RouterLink
  ],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css',
  host: { ngSkipHydration: 'true' }
})
export class AuthComponent implements OnDestroy {

  private authService = inject(AuthService);
  private router = inject(Router);
  private location = inject(Location);
  private toast = inject(ToastService);
  private store = inject(Store);
  private productService = inject(ProductService);
  private actions$ = inject(Actions);
  private platformId = inject(PLATFORM_ID);

  private readonly OTP_STATE_KEY = 'registerOtpState';

  mode: AuthMode =
    this.router.url.startsWith('/register')
      ? 'register'
      : this.router.url.startsWith('/verify-otp')
        ? 'otp'
        : 'login';

  error = '';
  submitError = '';
  submitting = false;

  // ---------------- LOGIN STATE ----------------

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

  // ---------------- REGISTER / OTP STATE ----------------

  showRegisterPassword = false;
  showConfirmPassword = false;

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
  }, {
    validators: passwordsMatchValidator('password', 'confirmPassword')
  });

  constructor() {
    // On refresh of /verify-otp, try to restore the saved OTP state.
    // If nothing is saved (e.g. /verify-otp opened directly), go to register.
    // Browser only: sessionStorage does not exist on the server.
    if (this.mode === 'otp' && isPlatformBrowser(this.platformId)) {
      if (!this.restoreOtpState()) {
        this.mode = 'register';
        this.location.replaceState('/register');
      }
    }
  }

  switchMode(mode: AuthMode): void {

    this.mode = mode;

    this.error = '';
    this.submitError = '';

    if (mode === 'login') {
      this.location.replaceState('/login');
    }

    else if (mode === 'register') {
      this.location.replaceState('/register');
    }

    else if (mode === 'otp') {
      this.location.replaceState('/verify-otp');
    }
  }

  // ======================= LOGIN =======================

  toggleLoginPasswordVisibility(): void {
    this.showLoginPassword = !this.showLoginPassword;
  }

  private handlePendingAction(): void {

    const pendingAction = this.authService.getPendingAction();

    if (!pendingAction) {
      this.router.navigate(['/home']);
      return;
    }

    this.productService
      .getProductById(pendingAction.productId)
      .subscribe({

        next: (product: Product) => {

          // ---------------- CART ----------------
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

          // ---------------- WISHLIST ----------------
          else if (pendingAction.type === 'wishlist') {

            this.store.dispatch(
              addToWishlist({ product: product })
            );

            this.authService.clearPendingAction();

            this.toast.success(`${product.title} added to wishlist.`);

            this.router.navigate(['/home']);
          }

          // ---------------- BUY NOW ----------------
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

    const email =
      this.loginForm.controls.email.value!
        .trim()
        .toLowerCase();

    const password = this.loginForm.controls.password.value!;

    this.authService
      .login(email, password)
      .subscribe({

        next: (user) => {

          this.submitting = false;

          
          this.toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
          if (user.role === 'admin') {
            this.router.navigate(['/admin']);
            return;
          }
          this.actions$
            .pipe(
              ofType(loadCartSuccess),
              take(1)
            )
            .subscribe(() => {
              this.handlePendingAction();
            });

          this.store.dispatch(loadCart());
          this.store.dispatch(loadWishlist());
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
          
            case 'ACCOUNT_DEACTIVATED':
              this.error =
                'Your account has been deactivated. Please contact the administrator.';
              break;
          
            default:
              this.error =
                'We could not sign you in right now. Please check your connection and try again.';
          }
        }
      });
  }

  // ======================= REGISTER =======================

  get passwordRules() {
    return passwordRuleStatus(
      this.registerForm.controls.password.value
    );
  }

  toggleRegisterPasswordVisibility(): void {
    this.showRegisterPassword = !this.showRegisterPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register(otpVerified = false): void {

    this.submitError = '';

    // Account cannot be created before OTP verification
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
      email:
        this.registerForm.controls.email.value!
          .trim()
          .toLowerCase(),
      password: this.registerForm.controls.password.value!,
      role: 'user' as const
    };

    this.authService
      .register(user)
      .subscribe({

        next: () => {

          this.submitting = false;

          this.clearOtpTimer();
          this.clearOtpState();

          this.toast.success('Account created successfully! Please sign in.');

          // Go back to login screen
          this.switchMode('login');

          // Clear OTP data
          this.generatedOtp = '';
          this.enteredOtp = '';
        },

        error: (error: Error) => {

          this.submitting = false;

          if (error.message === 'EMAIL_EXISTS') {
            this.submitError =
              'An account with this email already exists. Try signing in instead.';
          }

          else {
            this.submitError =
              'Something went wrong while creating your account. Please try again.';
          }
        }
      });
  }

  // ======================= OTP =======================

  sendOtp(): void {

    this.submitError = '';

    // Validate registration form first
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (this.submitting) {
      return;
    }

    this.submitting = true;

    const email =
      this.registerForm.controls.email.value!
        .trim()
        .toLowerCase();

    const name = this.registerForm.controls.name.value!.trim();

    // Check the email BEFORE generating or sending any OTP
    this.authService
      .checkEmailExists(email)
      .subscribe({

        next: (exists) => {

          if (exists) {
            this.submitting = false;
            this.submitError =
              'An account with this email already exists. Try signing in instead.';
            return; // no OTP generated, no OTP screen
          }

          this.dispatchOtp(email, name);
        },

        error: () => {
          this.submitting = false;
          this.submitError = 'Could not verify your email. Please try again.';
        }
      });
  }

  private dispatchOtp(email: string, name: string): void {

    // Generate 6 digit OTP
    this.generatedOtp =
      Math.floor(100000 + Math.random() * 900000).toString();

    const templateParams = {
      email: email,
      name: name,
      otp: this.generatedOtp
    };

    // Send OTP through EmailJS
    emailjs
      .send(
        'service_snnbzpm',
        'template_jwjbdak',
        templateParams,
        { publicKey: '-GreLdHC2wgW-xls9' }
      )

      .then(() => {

        this.submitting = false;

        // Start 2 minute OTP timer
        this.otpTimer = 120;
        this.otpExpiresAt = Date.now() + 120000;

        this.startOtpTimer();

        // Clear previous OTP input
        this.enteredOtp = '';

        // Persist so a page refresh keeps the OTP screen working
        this.saveOtpState();

        // Move to separate OTP screen
        this.switchMode('otp');

        this.toast.success('OTP sent to your email.');
      })

      .catch(() => {
        this.submitting = false;
        this.submitError =
          'Unable to send OTP. Please check your email and try again.';
      });
  }

  private startOtpTimer(): void {

    this.clearOtpTimer();

    this.otpInterval = setInterval(() => {

      const remaining = this.otpExpiresAt - Date.now();

      if (remaining <= 0) {
        this.otpTimer = 0;
        this.clearOtpTimer();
        return;
      }

      this.otpTimer = Math.ceil(remaining / 1000);

    }, 1000);
  }

  private clearOtpTimer(): void {

    if (this.otpInterval) {
      clearInterval(this.otpInterval);
      this.otpInterval = undefined;
    }
  }

  verifyOtp(): void {

    this.submitError = '';

    // Check expiry
    if (Date.now() > this.otpExpiresAt) {
      this.otpTimer = 0;
      this.submitError = 'OTP has expired. Please resend a new OTP.';
      return;
    }

    // Check entered OTP
    if (this.enteredOtp !== this.generatedOtp) {
      this.submitError = 'Invalid OTP. Please enter the correct OTP.';
      return;
    }

    // OTP correct
    this.register(true);
  }

  backToRegister(): void {
    this.submitError = '';
    this.enteredOtp = '';
    this.clearOtpState();
    this.switchMode('register');
  }

  // ======================= OTP STATE PERSISTENCE =======================

  private saveOtpState(): void {

    if (typeof sessionStorage === 'undefined') {
      return;
    }

    const form = this.registerForm.getRawValue();

    sessionStorage.setItem(
      this.OTP_STATE_KEY,
      JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
        generatedOtp: this.generatedOtp,
        otpExpiresAt: this.otpExpiresAt
      })
    );
  }

  private restoreOtpState(): boolean {

    if (typeof sessionStorage === 'undefined') {
      return false;
    }

    const raw = sessionStorage.getItem(this.OTP_STATE_KEY);

    if (!raw) {
      return false;
    }

    try {

      const state = JSON.parse(raw);

      this.registerForm.patchValue({
        name: state.name,
        email: state.email,
        password: state.password,
        confirmPassword: state.confirmPassword
      });

      this.generatedOtp = state.generatedOtp;
      this.otpExpiresAt = state.otpExpiresAt;

      const remaining = this.otpExpiresAt - Date.now();

      if (remaining > 0) {
        this.otpTimer = Math.ceil(remaining / 1000);
        this.startOtpTimer();
      } else {
        this.otpTimer = 0;
      }

      return true;

    } catch {
      this.clearOtpState();
      return false;
    }
  }

  private clearOtpState(): void {

    if (typeof sessionStorage === 'undefined') {
      return;
    }

    sessionStorage.removeItem(this.OTP_STATE_KEY);
  }

  ngOnDestroy(): void {
    this.clearOtpTimer();
  }
}