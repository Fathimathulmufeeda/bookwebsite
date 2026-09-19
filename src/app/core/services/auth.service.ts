import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private http=inject(HttpClient)
  private apiUrl = 'http://localhost:3000/users';

  register(user: any) {
    return this.http.post(this.apiUrl, user);
  }

  login(email: string) {
    return this.http.get<any[]>(`${this.apiUrl}?email=${email}`);
  }
}
