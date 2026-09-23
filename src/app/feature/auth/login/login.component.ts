import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

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
        this.router.navigate(['/home']);
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
}
