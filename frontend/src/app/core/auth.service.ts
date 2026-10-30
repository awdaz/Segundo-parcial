import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { EMPTY, Observable, catchError, finalize, tap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  LoginResponse,
  RefreshResponse,
  RegisterResponse,
  User,
  VerifyEmailResponse,
} from './models';
import { OfflineQueueService } from './offline-queue.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly offline = inject(OfflineQueueService);
  private readonly apiUrl = environment.apiUrl;

  private readonly accessKey = 'fs_access_token';
  private readonly refreshKey = 'fs_refresh_token';
  private readonly userKey = 'fs_user';
  private readonly tenantKey = 'fs_tenant';

  readonly user = signal<User | null>(this.readUser());
  readonly accessToken = signal<string | null>(localStorage.getItem(this.accessKey));
  readonly isAuthenticated = computed(() => !!this.accessToken() && !!this.user());
  readonly pendingOffline = signal(this.offline.hasPending());

  login(payload: {
    empresa_slug: string | null;
    correo: string;
    password: string;
  }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, payload).pipe(
      tap((response) => {
        this.storeSession(response);
        if (payload.empresa_slug) {
          localStorage.setItem(this.tenantKey, payload.empresa_slug);
        }
      }),
    );
  }

  register(payload: {
    empresa_slug: string;
    nombre: string;
    correo: string;
    telefono?: string | null;
    password: string;
  }): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/auth/register`, payload).pipe(
      tap(() => localStorage.setItem(this.tenantKey, payload.empresa_slug)),
    );
  }

  verifyEmail(payload: {
    empresa_slug: string;
    token: string;
  }): Observable<VerifyEmailResponse> {
    return this.http.post<VerifyEmailResponse>(`${this.apiUrl}/auth/verify-email`, payload);
  }

  refresh(): Observable<RefreshResponse> {
    const refreshToken = localStorage.getItem(this.refreshKey);
    if (!refreshToken) {
      return throwError(() => new Error('No hay token de refresco'));
    }
    return this.http
      .post<RefreshResponse>(`${this.apiUrl}/auth/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap((response) => {
          localStorage.setItem(this.accessKey, response.access_token);
          localStorage.setItem(this.refreshKey, response.refresh_token);
          this.accessToken.set(response.access_token);
        }),
      );
  }

  logout(): Observable<unknown> {
    const token = this.accessToken();
    const request: Observable<unknown> = token
      ? this.http.post(`${this.apiUrl}/auth/logout`, {})
      : EMPTY;

    return request.pipe(
      catchError(() => EMPTY),
      finalize(() => {
        this.clearSession();
        void this.router.navigate(['/login']);
      }),
    );
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/me`).pipe(
      tap((user) => {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.user.set(user);
      }),
    );
  }

  updateMe(payload: { nombre?: string | null; telefono?: string | null }): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/me`, payload).pipe(
      tap((user) => {
        localStorage.setItem(this.userKey, JSON.stringify(user));
        this.user.set(user);
      }),
    );
  }

  changePassword(payload: {
    password_actual: string;
    password_nueva: string;
  }): Observable<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>(`${this.apiUrl}/users/me/password`, payload);
  }

  tenantSlug(): string {
    return localStorage.getItem(this.tenantKey) ?? 'demo';
  }

  clearSession(): void {
    localStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.refreshKey);
    localStorage.removeItem(this.userKey);
    this.accessToken.set(null);
    this.user.set(null);
    this.pendingOffline.set(this.offline.hasPending());
  }

  private storeSession(response: LoginResponse): void {
    localStorage.setItem(this.accessKey, response.access_token);
    localStorage.setItem(this.refreshKey, response.refresh_token);
    localStorage.setItem(this.userKey, JSON.stringify(response.usuario));
    this.accessToken.set(response.access_token);
    this.user.set(response.usuario);
    this.pendingOffline.set(this.offline.hasPending());
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }
}

