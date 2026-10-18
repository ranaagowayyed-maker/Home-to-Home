import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { ToastService } from '../../shared/ui/toast.service';
import { Role } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';
import { TEST_USER } from '../auth/auth.testing';
import { authGuard, roleGuard } from './auth.guard';

describe('route guards', () => {
  let auth: AuthService;
  let toast: ToastService;
  const route: Route = {};

  const run = (guard: typeof authGuard, segments: UrlSegment[] = []) =>
    TestBed.runInInjectionContext(() => guard(route, segments));
  const serialize = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  function signInAs(role: Role): void {
    spyOn(auth, 'currentUser').and.returnValue({ ...TEST_USER, role });
    spyOn(auth, 'isAuthenticated').and.returnValue(true);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    toast = TestBed.inject(ToastService);
    spyOn(toast, 'error');
  });

  it('roleGuard allows the matching role', () => {
    signInAs('MOTHER');
    expect(run(roleGuard('MOTHER'))).toBeTrue();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('roleGuard redirects other roles to their home with a toast', () => {
    signInAs('CUSTOMER');
    expect(serialize(run(roleGuard('MOTHER')))).toBe('/browse');
    expect(toast.error).toHaveBeenCalledOnceWith("You don't have access to that page.");
  });

  it('roleGuard sends delivery users to available deliveries', () => {
    signInAs('DELIVERY');
    expect(serialize(run(roleGuard('CUSTOMER')))).toBe('/deliveries');
  });

  it('authGuard redirects anonymous users to login with a return URL', () => {
    const result = run(authGuard, [new UrlSegment('my-meals', {}), new UrlSegment('new', {})]);
    expect(serialize(result)).toBe('/login?returnUrl=%2Fmy-meals%2Fnew');
  });
});
