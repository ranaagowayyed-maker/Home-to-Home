import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, firstValueFrom, map, Observable, of, shareReplay, tap } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { AuthResponse, LoginRequest, RegisterRequest, User } from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly user = signal<User | null>(null);
  private readonly token = signal<string | null>(null);
  private refreshInFlight: Observable<AuthResponse> | null = null;

  readonly currentUser = this.user.asReadonly();
  readonly accessToken = this.token.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);

  login(body: LoginRequest): Observable<User> {
    return this.http
      .post<AuthResponse>(apiUrl('/auth/login'), body)
      .pipe(map((res) => this.startSession(res)));
  }

  register(body: RegisterRequest): Observable<User> {
    return this.http
      .post<AuthResponse>(apiUrl('/auth/register'), body)
      .pipe(map((res) => this.startSession(res)));
  }

  /** Concurrent callers share a single in-flight refresh request. */
  refresh(): Observable<AuthResponse> {
    this.refreshInFlight ??= this.http.post<AuthResponse>(apiUrl('/auth/refresh'), null).pipe(
      tap((res) => this.startSession(res)),
      finalize(() => (this.refreshInFlight = null)),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    return this.refreshInFlight;
  }

  logout(): Observable<void> {
    return this.http.post<void>(apiUrl('/auth/logout'), null).pipe(
      catchError(() => of(undefined)),
      map(() => this.clearSession()),
    );
  }

  me(): Observable<User> {
    return this.http.get<User>(apiUrl('/auth/me')).pipe(tap((user) => this.user.set(user)));
  }

  /** Replaces the signed-in user after their profile changed on the server. */
  updateUser(user: User): void {
    if (this.user()?.id === user.id) {
      this.user.set(user);
    }
  }

  restoreSession(): Promise<unknown> {
    return firstValueFrom(this.refresh().pipe(catchError(() => of(null))));
  }

  clearSession(): void {
    this.user.set(null);
    this.token.set(null);
  }

  private startSession(res: AuthResponse): User {
    this.token.set(res.accessToken);
    this.user.set(res.user);
    return res.user;
  }
}
