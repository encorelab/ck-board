import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, timeout } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { environment } from 'src/environments/environment';

export const DEFAULT_TIMEOUT = 30000;

@Injectable()
export class APIInterceptor implements HttpInterceptor {
  private cache: Map<string, HttpResponse<any>>;

  constructor(public auth: UserService) {
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
      );
  }

  shouldCache(req: HttpRequest<any>): boolean {
    return req.method === 'GET' && req.headers.get('cache') === 'true';
  }
}
