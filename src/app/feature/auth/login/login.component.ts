import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { login } from '../../../store/auth/auth.action'; 
import { selectAuthError } from '../../../store/auth/auth.selectors';
import { AsyncPipe } from '@angular/common';
import { selectLoggedIn } from '../../../store/auth/auth.selectors';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule,AsyncPipe],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  
  private router=inject(Router)
  private store = inject(Store);
  error$ = this.store.select(selectAuthError);
  loggedIn$ = this.store.select(selectLoggedIn);

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
  
    this.store.dispatch(
      login({
        email,
        password
      })
    );
  }
}
