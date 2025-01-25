import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, timeout } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

export const DEFAULT_TIMEOUT = 30000;

@Injectable()
export class APIInterceptor implements HttpInterceptor {
  private cache: Map<string, HttpResponse<any>>;

  constructor(public auth: UserService, private router: Router) {
    this.cache = new Map();
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const timeoutValue = Number(req.headers.get('timeout') || DEFAULT_TIMEOUT);

    const apiReq = req.clone({
      url: `${environment.ckboardDomain}/api/${req.url}`,
      setHeaders: {
        Authorization: `Bearer ${this.auth.token}`,
      },
    });

    if (this.shouldCache(apiReq)) {
      const cachedResponse: HttpResponse<any> | undefined = this.cache.get(
        apiReq.urlWithParams
      );
      if (cachedResponse) {
        return of(cachedResponse.clone());
      }
    }

    return next
      .handle(apiReq)
      .pipe(timeout(timeoutValue))
      .pipe(
        tap<HttpEvent<any>>((httpEvent: HttpEvent<any>) => {
          if (httpEvent instanceof HttpResponse && this.shouldCache(apiReq)) {
            this.cache.set(apiReq.urlWithParams, httpEvent.clone());
          }
        })
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            // Token expired or invalid, clear user data and navigate to login
            this.auth.logout();
            this.router.navigate(['/login']);
          }
          return throwError(() => error);
        })
      );
  }

  shouldCache(req: HttpRequest<any>): boolean {
    return req.method === 'GET' && req.headers.get('cache') === 'true';
  }
}