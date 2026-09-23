import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PASSWORD_PATTERN, passwordRuleStatus, passwordsMatchValidator } from '../../../shared/validators/custom-validators';

type Step = 'email' | 'reset' | 'done';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {

  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  step: Step = 'email';
  submitting = false;
  error = '';
  showPassword = false;
  showConfirmPassword = false;

  private matchedUserId: number | null = null;
  matchedUserName = '';

  emailForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email])
  });

  resetForm = new FormGroup({
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(PASSWORD_PATTERN)
    ]),
    confirmPassword: new FormControl('', [Validators.required])
  }, { validators: passwordsMatchValidator('password', 'confirmPassword') });

  get passwordRules() {
    return passwordRuleStatus(this.resetForm.controls.password.value);
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  submitEmail(): void {

    this.error = '';

    if (this.emailForm.invalid || this.submitting) {
      this.emailForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    const email = this.emailForm.controls.email.value!.trim().toLowerCase();

    this.authService.requestPasswordReset(email).subscribe({
      next: (user) => {
        this.submitting = false;
        this.matchedUserId = user.id;
        this.matchedUserName = user.name;
        this.step = 'reset';
      },
      error: (err: Error) => {
        this.submitting = false;

        this.error = err.message === 'NO_ACCOUNT'
          ? 'No account found with this email address.'
          : 'Something went wrong. Please try again.';
      }
    });
  }

  submitReset(): void {

    this.error = '';

    if (this.resetForm.invalid || this.submitting || this.matchedUserId == null) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.submitting = true;

    this.authService.resetPassword(this.matchedUserId, this.resetForm.controls.password.value!).subscribe({
      next: () => {
        this.submitting = false;
        this.step = 'done';
        this.toast.success('Password updated. Please sign in with your new password.');
      },
      error: () => {
        this.submitting = false;
        this.error = 'Could not update your password. Please try again.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
