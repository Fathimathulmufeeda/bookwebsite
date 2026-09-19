import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  private authService = inject(AuthService);
  message = '';

  registerForm = new FormGroup({
    name: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(/^[a-zA-Z ]+$/)
    ]),

    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),

    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).+$/)
    ]),

    confirmPassword: new FormControl('', [
      Validators.required
    ])

  });

  register() {

    const password = this.registerForm.controls['password'].value;
    const confirmPassword = this.registerForm.controls['confirmPassword'].value;

    if (password !== confirmPassword) {
      return;
    }

    const user = {
      name: this.registerForm.controls['name'].value!,
      email: this.registerForm.controls['email'].value!,
      password: this.registerForm.controls['password'].value!,
      role: 'user' as const
    };
    this.authService.register(user).subscribe({
      next: () => {
        this.message = 'Registration successful!';
      },
      error: () => {
        this.message = 'Registration failed!';
      }
    });
  }
}