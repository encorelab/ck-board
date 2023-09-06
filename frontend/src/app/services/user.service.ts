import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import User, { AuthUser, TokenResponse } from '../models/user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  redirectUrl: string | null = null;
  signInWindow: any;

  constructor(private http: HttpClient) {}

  getOneById(id: string): Promise<User> {
    return this.http.get<User>('auth/' + id).toPromise();
  }

  getMultipleByIds(ids: string[]) {
    return this.http.post<User[]>('auth/multiple', ids).toPromise();
  }

  getByProject(projectID: string): Promise<AuthUser[]> {
    return this.http.get<AuthUser[]>('auth/project/' + projectID).toPromise();
  }

  async register(user: User) {
    return this.http
      .post<TokenResponse>('auth/register', user)
      .toPromise()
      .then((result) => {
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('access_token', result.token);
        localStorage.setItem('expires_at', result.expiresAt);
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
        localStorage.setItem('expires_at', result.expiresAt);
        return true;
      });
  }

  async isSsoEnabled(): Promise<boolean> {
    return this.http
      .get('auth/is-sso-enabled')
      .toPromise()
      .then((response: any) => {
        return response.isSsoEnabled;
      });
  }

  async trySsoLogin(attemptedUrl: string): Promise<any> {
    this.addLoadAttemptedUrlListener(attemptedUrl);
    return this.http
      .get('auth/sso/handshake')
      .toPromise()
      .then((response: any) => {
        this.openSignInWindow(response, attemptedUrl);
        return false;
      });
  }

  addLoadAttemptedUrlListener(attemptedUrl: string): void {
    window.addEventListener('message', (event) => {
      if (event.data === 'loadAttemptedUrl') {
        window.location.href = attemptedUrl;
        this.signInWindow.close();
      }
    });
  }

  openSignInWindow(response: any, attemptedUrl: string): void {
    const ssoEndpoint =
      response.scoreSsoEndpoint +
      `?sig=${response.sig}&sso=${response.sso}&redirectUrl=${attemptedUrl}`;
    const params = 'width=800,height=600';
    this.signInWindow = window.open(ssoEndpoint, 'SCORE Login Window', params);
  }

  async ssoLogin(sso: string | null, sig: string | null): Promise<boolean> {
    return this.http
      .get(`auth/sso/login/${sso}/${sig}`)
      .toPromise()
      .then((result: any) => {
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('access_token', result.token);
        localStorage.setItem('expires_at', result.expiresAt);
        window.location.href = result.redirectUrl;
        return true;
      });
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('expires_at');
  }

  update(id: string, user: Partial<User>) {
    return this.http.post('auth/' + id, user).toPromise();
  }

  delete(id: string) {
    return this.http.delete('auth/' + id).toPromise();
  }

  public get loggedIn(): boolean {
    const token = localStorage.getItem('access_token');
    const expiry = localStorage.getItem('expires_at');

    if (!expiry || !token) return false;

    const expiryAsNumber = new Date(expiry).getTime();

    return Date.now() < expiryAsNumber;
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
