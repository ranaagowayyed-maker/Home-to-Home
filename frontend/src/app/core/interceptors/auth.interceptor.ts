import {
  HttpContextToken,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { ToastService } from '../../shared/ui/toast.service';
import { apiUrl, isApiUrl } from '../api/api-url';
import { AuthService } from '../auth/auth.service';

/** Set on requests that must never carry the access token (e.g. direct uploads to storage). */
export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);

const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'].map(
  apiUrl,
);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_AUTH) || !isApiUrl(req.url)) {
    return next(req);
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);
  const send = (token: string | null) => next(prepare(req, token));

  return send(auth.accessToken()).pipe(
    catchError((error: unknown) => {
      const canRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !NO_REFRESH_PATHS.includes(req.url);
      if (!canRefresh) {
        return throwError(() => error);
      }
      return auth.refresh().pipe(
        catchError((refreshError: unknown) => {
          if (auth.isAuthenticated()) {
            auth.clearSession();
            toast.error('Your session expired.');
            void router.navigateByUrl('/login');
          }
          return throwError(() => refreshError);
        }),
        switchMap((session) => send(session.accessToken)),
      );
    }),
  );
};

function prepare(req: HttpRequest<unknown>, token: string | null): HttpRequest<unknown> {
  return req.clone({
    withCredentials: req.url.startsWith(apiUrl('/auth/')) || req.withCredentials,
    setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
