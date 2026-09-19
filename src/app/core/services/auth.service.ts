import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { User } from '../Models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/users';

  login(email: string, password: string): Observable<User[]> {
    return this.http.get<User[]>(
      `${this.apiUrl}?email=${email}&password=${password}`
    );
  }

  register(user: Omit<User, 'id'>): Observable<User> {
    return this.http.get<User[]>(
      `${this.apiUrl}?email=${user.email}`
    ).pipe(
      switchMap(users => {
  
        if (users.length > 0) {
          throw new Error('Email already exists');
        }
  
        return this.http.post<User>(this.apiUrl, user);
      })
    );
  }

  isLoggedIn(): boolean {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem('loggedIn') === 'true'
      : false;
  }

  logout(): void {
    localStorage.removeItem('loggedIn');
  }
}