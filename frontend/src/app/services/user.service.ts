import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import User, { AuthUser, TokenResponse } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private http: HttpClient) {}

  getOneById(id: string): Promise<User> {
    return this.http.get<User>('auth/' + id).toPromise();
  }

  async register(user: User) {
    return this.http
      .post<TokenResponse>('auth/register', user)
      .toPromise()
      .then((result) => {
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('access_token', result.token);
        return true;
      });
  }

  async login(email: string, password: string): Promise<boolean> {
    return this.http
      .post<TokenResponse>('auth/login', {
        email: email,
        password: password,
      })
      .toPromise()
      .then((result) => {
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('access_token', result.token);
        return true;
      });
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
  }

  update(id: string, user: Partial<User>) {
    return this.http.post('auth/' + id, user).toPromise();
  }

  delete(id: string) {
    return this.http.delete('auth/' + id).toPromise();
  }

  public get loggedIn(): boolean {
    return localStorage.getItem('access_token') !== null;
  }

  public get token(): string | null {
    return localStorage.getItem('access_token');
  }

  public get user(): AuthUser | null {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser);
    }

    return null;
  }
}
