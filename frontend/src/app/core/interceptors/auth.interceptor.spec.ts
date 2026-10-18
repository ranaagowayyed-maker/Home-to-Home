import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ToastService } from '../../shared/ui/toast.service';
import { AuthService } from '../auth/auth.service';
import { authResponse } from '../auth/auth.testing';
import { authInterceptor, SKIP_AUTH } from './auth.interceptor';

const unauthorized = { status: 401, statusText: 'Unauthorized' };

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let auth: AuthService;

  function signIn(token = 'access-1'): void {
    auth.login({ email: 'a@b.co', password: 'secret123' }).subscribe();
    backend.expectOne('/api/v1/auth/login').flush(authResponse(token));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => backend.verify());

  it('attaches the bearer token to API requests', () => {
    signIn();
    http.get('/api/v1/meals/mine').subscribe();

    const req = backend.expectOne('/api/v1/meals/mine');
    expect(req.request.headers.get('Authorization')).toBe('Bearer access-1');
    expect(req.request.withCredentials).toBeFalse();
    req.flush({});
  });

  it('sends credentials on auth endpoints', () => {
    auth.refresh().subscribe({ error: () => undefined });
    const req = backend.expectOne('/api/v1/auth/refresh');
    expect(req.request.withCredentials).toBeTrue();
    req.flush({}, unauthorized);
  });

  it('never touches requests outside the API or marked SKIP_AUTH', () => {
    signIn();
    http.put('https://storage.example.com/upload', 'x').subscribe();
    http.get('/api/v1/meals/mine', { context: new HttpContext().set(SKIP_AUTH, true) }).subscribe();

    expect(
      backend.expectOne('https://storage.example.com/upload').request.headers.has('Authorization'),
    ).toBeFalse();
    expect(
      backend.expectOne('/api/v1/meals/mine').request.headers.has('Authorization'),
    ).toBeFalse();
  });

  it('refreshes once on 401 and retries every queued request with the new token', () => {
    signIn('expired');
    const results: unknown[] = [];
    http.get('/api/v1/meals/mine').subscribe((r) => results.push(r));
    http.get('/api/v1/auth/me').subscribe((r) => results.push(r));

    backend.expectOne('/api/v1/meals/mine').flush(null, unauthorized);
    backend.expectOne('/api/v1/auth/me').flush(null, unauthorized);
    backend.expectOne('/api/v1/auth/refresh').flush(authResponse('fresh'));

    const retriedMeals = backend.expectOne('/api/v1/meals/mine');
    const retriedMe = backend.expectOne('/api/v1/auth/me');
    expect(retriedMeals.request.headers.get('Authorization')).toBe('Bearer fresh');
    expect(retriedMe.request.headers.get('Authorization')).toBe('Bearer fresh');
    retriedMeals.flush({ items: [] });
    retriedMe.flush({ id: 'u1' });

    expect(results).toEqual([{ items: [] }, { id: 'u1' }]);
  });

  it('does not refresh when login itself is rejected', () => {
    let status = 0;
    auth.login({ email: 'a@b.co', password: 'wrong' }).subscribe({
      error: (e: { status: number }) => (status = e.status),
    });
    backend.expectOne('/api/v1/auth/login').flush({ code: 'invalid_credentials' }, unauthorized);

    backend.expectNone('/api/v1/auth/refresh');
    expect(status).toBe(401);
  });

  it('signs out and redirects to login when the refresh fails', () => {
    const router = TestBed.inject(Router);
    const toast = TestBed.inject(ToastService);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    spyOn(toast, 'error');
    signIn('expired');

    http.get('/api/v1/meals/mine').subscribe({ error: () => undefined });
    backend.expectOne('/api/v1/meals/mine').flush(null, unauthorized);
    backend
      .expectOne('/api/v1/auth/refresh')
      .flush({ code: 'invalid_refresh_token' }, unauthorized);

    expect(auth.isAuthenticated()).toBeFalse();
    expect(toast.error).toHaveBeenCalledOnceWith('Your session expired.');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
