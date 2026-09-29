import { Component, inject } from '@angular/core';
import {FormControl,FormGroup,FormsModule,ReactiveFormsModule,Validators} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/services/toast.service';
import {NAME_PATTERN,PASSWORD_PATTERN,passwordsMatchValidator,passwordRuleStatus} from '../../../shared/validators/custom-validators';
import emailjs from '@emailjs/browser';
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink,FormsModule],
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

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
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
  sendOtp(): void {

    this.submitError = '';
  
    // Validate the registration fields first
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
  
    const email = this.registerForm.controls.email.value!.trim().toLowerCase();
    const name = this.registerForm.controls.name.value!.trim();
  
    // Generate a 6-digit OTP
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
  
      // 2 minutes = 120 seconds
      this.otpTimer = 120;
  
      // Actual expiry time
      this.otpExpiresAt = Date.now() + 120000;
  
      this.startOtpTimer();
  
      this.toast.success('OTP sent to your email.');
  
    })
    .catch(() => {
  
      this.submitError =
        'Unable to send OTP. Please check your email and try again.';
  
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
  
    // Check whether OTP has expired
    if (Date.now() > this.otpExpiresAt) {
      this.otpTimer = 0;
      this.submitError = 'OTP has expired. Please resend a new OTP.';
      return;
    }
  
    // Check OTP
    if (this.enteredOtp !== this.generatedOtp) {
      this.submitError = 'Invalid OTP. Please enter the correct OTP.';
      return;
    }
  
    // OTP is correct
    this.register(true);
  }
}
