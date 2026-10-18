import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { User } from './auth.models';
import { AuthService } from './auth.service';
import { authResponse, TEST_USER } from './auth.testing';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('stores the user and access token after login', () => {
    let result: User | undefined;
    service.login({ email: TEST_USER.email, password: 'secret123' }).subscribe((u) => (result = u));

    const req = http.expectOne('/api/v1/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: TEST_USER.email, password: 'secret123' });
    req.flush(authResponse());

    expect(result).toEqual(TEST_USER);
    expect(service.currentUser()).toEqual(TEST_USER);
    expect(service.accessToken()).toBe('access-1');
    expect(service.isAuthenticated()).toBeTrue();
  });

  it('clears the session on logout, even when the request fails', () => {
    service.login({ email: TEST_USER.email, password: 'secret123' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush(authResponse());

    let done = false;
    service.logout().subscribe(() => (done = true));
    http.expectOne('/api/v1/auth/logout').flush(null, { status: 500, statusText: 'Server Error' });

    expect(done).toBeTrue();
    expect(service.currentUser()).toBeNull();
    expect(service.accessToken()).toBeNull();
  });

  it('shares a single in-flight refresh between concurrent callers', () => {
    const tokens: string[] = [];
    service.refresh().subscribe((r) => tokens.push(r.accessToken));
    service.refresh().subscribe((r) => tokens.push(r.accessToken));

    http.expectOne('/api/v1/auth/refresh').flush(authResponse('access-2'));

    expect(tokens).toEqual(['access-2', 'access-2']);
    expect(service.accessToken()).toBe('access-2');
  });

  it('restores nothing when there is no valid refresh cookie', async () => {
    const restored = service.restoreSession();
    http
      .expectOne('/api/v1/auth/refresh')
      .flush({ code: 'invalid_refresh_token' }, { status: 401, statusText: 'Unauthorized' });

    await restored;
    expect(service.isAuthenticated()).toBeFalse();
  });
});
