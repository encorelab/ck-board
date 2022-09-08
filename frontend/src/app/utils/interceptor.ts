import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserService } from '../services/user.service';

@Injectable()
export class APIInterceptor implements HttpInterceptor {
  constructor(public auth: UserService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const apiReq = req.clone({
      url: `https://ck-board.oise.utoronto.ca/api/${req.url}`,
      setHeaders: {
        Authorization: `Bearer ${this.auth.token}`,
      },
    });
    return next.handle(apiReq);
  }
}
