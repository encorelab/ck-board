import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import User, { AuthUser, TokenResponse } from '../models/user';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  redirectUrl: string | null = null;

  constructor(private http: HttpClient) {}

  async getOneById(id: string): Promise<User | undefined> {
    return lastValueFrom(this.http.get<User>(`auth/${id}`, { headers: { cache: 'true' } }));
  }

  async getMultipleByIds(ids: string[]): Promise<User[] | undefined> {
    return lastValueFrom(this.http.post<User[]>('auth/multiple', ids));
  }

  async getByProject(projectID: string): Promise<AuthUser[] | undefined> {
    return lastValueFrom(this.http.get<AuthUser[]>(`auth/project/${projectID}`));
  }

  async register(user: User): Promise<boolean> {
    try {
      const result: TokenResponse = await lastValueFrom(this.http.post<TokenResponse>('auth/register', user));
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('access_token', result.token);
      localStorage.setItem('expires_at', result.expiresAt);
      return true;
    } catch (error) {
      // Handle registration error (e.g., log, show error message)
      console.error('Registration error:', error);
      return false;
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    try {
      const result: TokenResponse = await lastValueFrom(this.http.post<TokenResponse>('auth/login', { email, password }));
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('access_token', result.token);
      localStorage.setItem('expires_at', result.expiresAt);
      return true;
    } catch (error) {
      // Handle login error
      console.error('Login error:', error);
      return false;
    }
  }

  async isSsoEnabled(): Promise<boolean> {
    try {
      const response = await lastValueFrom(this.http.get('auth/is-sso-enabled'));
      return response.isSsoEnabled;
    } catch (error) {
      // Handle error while checking SSO status
      console.error('Error checking SSO status:', error);
      return false; // Or handle the error in a way that makes sense for your app
    }
  }

  async trySsoLogin(attemptedUrl: string): Promise<boolean> {
    try {
      const response = await lastValueFrom(this.http.get('auth/sso/handshake'));
      if (response && response.scoreSsoEndpoint && response.sig && response.sso) { // Check if the response properties exist
        window.location.href = `${response.scoreSsoEndpoint}?sig=${response.sig}&sso=${response.sso}&redirectUrl=${attemptedUrl}`;
        return false; // Or return a value that indicates the redirect was initiated
      } else {
        // Handle the case where the response is not as expected
        console.error('Invalid response from SSO handshake:', response);
        return false; // Or throw an error, depending on your error handling strategy
      }
    } catch (error) {
      // Handle errors that occur during the request
      console.error('Error initiating SSO login:', error);
      return false; // Or throw an error
    }
  }
  
  async ssoLogin(sso: string | null, sig: string | null): Promise<boolean> {
    try {
      if (!sso || !sig) {
        // Handle the case where SSO parameters are missing
        console.error('Missing SSO parameters');
        return false; // Or throw an error
      }
      const result: TokenResponse = await lastValueFrom(this.http.get<TokenResponse>(`auth/sso/login/${sso}/${sig}`));
      localStorage.setItem('user', JSON.stringify(result.user));
      localStorage.setItem('access_token', result.token);
      localStorage.setItem('expires_at', result.expiresAt);
  
      // Ensure redirectUrl exists before using it
      if (result.redirectUrl) { 
        window.location.href = result.redirectUrl;
      } else {
        console.error('Missing redirectUrl in SSO login response');
        // Optionally redirect to a default page or handle the error differently
      }
      return true;
    } catch (error) {
      // Handle errors that occur during the request
      console.error('Error completing SSO login:', error);
      return false; // Or throw an error
    }
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('expires_at');
  }

  async update(id: string, user: Partial<User>): Promise<User | undefined> {
    return lastValueFrom(this.http.post<User>(`auth/${id}`, user));
  }

  async delete(id: string): Promise<void> {
    const response$ = this.http.delete(`auth/${id}`);
    return await lastValueFrom(response$);
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
