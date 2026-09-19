import { Component, inject } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private authService = inject(AuthService);
  private router = inject(Router);

  error = '';

  loginForm = new FormGroup({

    email: new FormControl('', [
      Validators.required,
      Validators.email
    ]),

    password: new FormControl('', [
      Validators.required
    ])

  });

  login() {

    const email = this.loginForm.controls['email'].value!;
    const password = this.loginForm.controls['password'].value!;

    this.authService.login(email, password).subscribe(users => {

      if (users.length === 0) {
        this.error = 'Incorrect email or password';
        return;
      }

      localStorage.setItem('loggedIn', 'true');

      this.router.navigate(['/home']);
    });
  }
}