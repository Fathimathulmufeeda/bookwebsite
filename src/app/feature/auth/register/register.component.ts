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
import {
  NAME_PATTERN,
  PASSWORD_PATTERN,
  passwordsMatchValidator,
  passwordRuleStatus
} from '../../../shared/validators/custom-validators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  submitError = '';
  submitting = false;
  showPassword = false;
  showConfirmPassword = false;

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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register(): void {

    this.submitError = '';

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
        this.router.navigate(['/login']);
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
}
