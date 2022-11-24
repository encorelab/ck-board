import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UserService } from '../services/user.service';
import { Router } from '@angular/router';

@Injectable()
export class APIInterceptor implements HttpInterceptor {
  constructor(public auth: UserService, private router: Router) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const apiReq = req.clone({
      url: `http://localhost:8001/api/${req.url}`,
      setHeaders: {
        Authorization: `Bearer ${this.auth.token}`,
      },
    });
    return next.handle(apiReq).pipe(
      catchError(async (err) => {
        if (err instanceof HttpErrorResponse && err.status == 401) {
          this.auth.clearLocalStorage();
          this.router.navigate(['login']);
        }
        return err;
      })
    );
  }
}
