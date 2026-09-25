import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap, map, catchError, throwError } from 'rxjs';
import { User } from '../Models/user.model';


export interface PendingAction {
  type: 'cart' | 'wishlist' | 'buyNow';
  productId: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/users';

  private readonly LOGGED_IN_KEY = 'loggedIn';
  private readonly CURRENT_USER_KEY = 'currentUser';
  private readonly PENDING_ACTION_KEY = 'pendingAction';
  
  checkEmailExists(email: string): Observable<boolean> {
    return this.http
      .get<User[]>(`${this.apiUrl}?email=${encodeURIComponent(email)}`)
      .pipe(map(users => users.length > 0));
  }

  login(email: string, password: string): Observable<User> {

    return this.http
      .get<User[]>(`${this.apiUrl}?email=${encodeURIComponent(email)}`)
      .pipe(
        switchMap(users => {

          if (users.length === 0) {
            return throwError(() => new Error('NO_ACCOUNT'));
          }

          const user = users[0];

          if (user.password !== password) {
            return throwError(() => new Error('WRONG_PASSWORD'));
          }

          return [user];
        }),
        tap(user => {
          this.setSession(user);
        }),
        catchError(error => {

          if (!(error instanceof Error) || (error.message !== 'NO_ACCOUNT' && error.message !== 'WRONG_PASSWORD')) {
            return throwError(() => new Error('NETWORK_ERROR'));
          }

          return throwError(() => error);
        })
      );
  }

  register(user: Omit<User, 'id'>): Observable<User> {
    return this.checkEmailExists(user.email).pipe(
      switchMap(exists => {

        if (exists) {
          return throwError(() => new Error('EMAIL_EXISTS'));
        }

        return this.http.post<User>(this.apiUrl, user);
      }),
      catchError(error => {

        if (error instanceof Error && error.message === 'EMAIL_EXISTS') {
          return throwError(() => error);
        }

        return throwError(() => new Error('NETWORK_ERROR'));
      })
    );
  }

  private setSession(user: User): void {

    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.LOGGED_IN_KEY, 'true');

    const { password, ...safeUser } = user;

    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(safeUser));
  }

  getCurrentUser(): Omit<User, 'password'> | null {

    if (typeof localStorage === 'undefined') {
      return null;
    }

    const data = localStorage.getItem(this.CURRENT_USER_KEY);

    return data ? JSON.parse(data) : null;
  }

  isLoggedIn(): boolean {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem(this.LOGGED_IN_KEY) === 'true'
      : false;
  }

  logout(): void {

    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(this.LOGGED_IN_KEY);
    localStorage.removeItem(this.CURRENT_USER_KEY);
    localStorage.removeItem(this.PENDING_ACTION_KEY);
  }

  
  requestPasswordReset(email: string): Observable<User> {

    return this.http
      .get<User[]>(`${this.apiUrl}?email=${encodeURIComponent(email)}`)
      .pipe(
        switchMap(users => {

          if (users.length === 0) {
            return throwError(() => new Error('NO_ACCOUNT'));
          }

          return [users[0]];
        }),
        catchError(error => {

          if (error instanceof Error && error.message === 'NO_ACCOUNT') {
            return throwError(() => error);
          }

          return throwError(() => new Error('NETWORK_ERROR'));
        })
      );
  }

  
  resetPassword(userId: number, newPassword: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}`, { password: newPassword }).pipe(
      catchError(() => throwError(() => new Error('NETWORK_ERROR')))
    );

  }
  savePendingAction(action: PendingAction): void {

    if (typeof localStorage === 'undefined') {
      return;
    }
  
    localStorage.setItem(
      this.PENDING_ACTION_KEY,
      JSON.stringify(action)
    );
  }

  getPendingAction(): PendingAction | null {

    if (typeof localStorage === 'undefined') {
      return null;
    }
  
    const data = localStorage.getItem(this.PENDING_ACTION_KEY);
  
    return data ? JSON.parse(data) : null;
  }

  clearPendingAction(): void {

    if (typeof localStorage === 'undefined') {
      return;
    }
  
    localStorage.removeItem(this.PENDING_ACTION_KEY);
  }

}
