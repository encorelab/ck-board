import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { UserService } from '../services/user.service';

export const DEFAULT_TIMEOUT = 30000;

@Injectable()
export class APIInterceptor implements HttpInterceptor {
  constructor(public auth: UserService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const timeoutValue = Number(req.headers.get('timeout') || DEFAULT_TIMEOUT);

    const apiReq = req.clone({
      url: `https://ck-board.oise.utoronto.ca/api/${req.url}`,
      setHeaders: {
        Authorization: `Bearer ${this.auth.token}`,
      },
    });
    return next.handle(apiReq).pipe(timeout(timeoutValue));
  }
}
