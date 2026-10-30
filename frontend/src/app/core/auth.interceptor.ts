import {
  HttpErrorResponse,
  HttpInterceptorFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, switchMap, throwError } from 'rxjs';

import { AuthService } from './auth.service';
import { RefreshResponse } from './models';

let refreshInProgress: Observable<RefreshResponse> | null = null;

const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/verify-email',
];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isAuthCall = AUTH_ENDPOINTS.some((endpoint) => request.url.includes(endpoint));
  const token = auth.accessToken();

  const authenticatedRequest =
    token && !isAuthCall
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuthCall) {
        return throwError(() => error);
      }

      const refreshToken = localStorage.getItem('fs_refresh_token');
      if (!refreshToken) {
        auth.clearSession();
        void router.navigate(['/login']);
        return throwError(() => error);
      }

      if (!refreshInProgress) {
        refreshInProgress = auth.refresh().pipe(
          finalize(() => {
            refreshInProgress = null;
          }),
        );
      }

      return refreshInProgress.pipe(
        switchMap((response) =>
          next(
            request.clone({
              setHeaders: { Authorization: `Bearer ${response.access_token}` },
            }),
          ),
        ),
        catchError((refreshError) => {
          auth.clearSession();
          void router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
