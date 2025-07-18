import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http'; // Import HttpErrorResponse
import User, { AuthUser, TokenResponse } from '../models/user';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  redirectUrl: string | null = null;

  constructor(private http: HttpClient) {}

  getOneById(id: string): Promise<User> {
    return this.http
      .get<User>('auth/' + id, { headers: { cache: 'true' } })
      .toPromise()
      .then((user) => user!); // Assert that user is defined (or handle accordingly)
  }

  getMultipleByIds(ids: string[]): Promise<User[]> {
    return this.http
      .post<User[]>('auth/multiple', ids)
      .toPromise()
      .then((user) => user!);
  }

  getByProject(projectID: string): Promise<AuthUser[]> {
    return this.http
      .get<AuthUser[]>('auth/project/' + projectID)
      .toPromise()
      .then((users) => users ?? []); // Default to an empty array
  }

  async register(user: User): Promise<boolean> {
    try {
      const result = await this.http
        .post<TokenResponse>('auth/register', user)
        .toPromise();

      if (result) {
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('access_token', result.token);
        localStorage.setItem('expires_at', result.expiresAt);
      }
      return true;
    } catch (error: any) {
      if (error.error && error.error.message) {
        throw new Error(error.error.message);
      } else {
        throw new Error('Something bad happened; please try again later.');
      }
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    return this.http
      .post<TokenResponse>('auth/login', {
        email: email,
        password: password,
      })
      .toPromise()
      .then((result) => {
        if (result) {
          localStorage.setItem('user', JSON.stringify(result.user));
          localStorage.setItem('access_token', result.token);
          localStorage.setItem('expires_at', result.expiresAt);
        }
        return true;
      });
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    return this.http
      .post<{ success: boolean }>('auth/forgot-password', { email }) // Expect a success: boolean response
      .toPromise()
      .then((result) => {
        if (result) {
          console.log('password reset requested');
        }
        return true;
      });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await lastValueFrom(
      this.http.post('auth/reset-password', { token, newPassword })
    );
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
    return this.http
      .get('auth/sso/handshake')
      .toPromise()
      .then((response: any) => {
        window.location.href = `${response.scoreSsoEndpoint}?sig=${response.sig}&sso=${response.sso}&redirectUrl=${attemptedUrl}`;
        return false;
      });
  }

  async ssoLogin(sso: string | null, sig: string | null): Promise<boolean> {
    return this.http
      .get(`auth/sso/login/${sso}/${sig}`)
      .toPromise()
      .then((result: any) => {
        if (result) {
          localStorage.setItem('user', JSON.stringify(result.user));
          localStorage.setItem('access_token', result.token);
          localStorage.setItem('expires_at', result.expiresAt);
          window.location.href = result.redirectUrl;
        }
        return true;
      });
  }

  async generateApiKey(): Promise<string> {
    return this.http
      .get(`auth/generate-api-key/` + this.user?.userID)
      .toPromise()
      .then((result: any) => {
        if (result) {
          return result;
        }
      });
  }

  async deleteApiKey() {
    return this.http
      .delete(`auth/delete-api-key/` + this.user?.userID)
      .toPromise();
  }

  async checkApiKey(): Promise<boolean> {
    return this.http
      .get(`auth/check-api-key/` + this.user?.userID)
      .toPromise()
      .then((result: any) => {
        if (result) {
          return result;
        }
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

  updateCurrentView(userID: string, viewType: string): Promise<any> {
    return this.http
      .patch<any>(`auth/${userID}/currentView`, { viewType })
      .toPromise()
      .catch(() => undefined); // Handle undefined case
  }
}
