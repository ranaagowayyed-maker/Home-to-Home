import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlSegment } from '@angular/router';
import { ToastService } from '../../shared/ui/toast.service';
import { Role, ROLE_HOME } from '../auth/auth.models';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanMatchFn = (_route, segments: UrlSegment[]) => {
  if (inject(AuthService).isAuthenticated()) {
    return true;
  }
  const returnUrl = '/' + segments.map((s) => s.path).join('/');
  return inject(Router).createUrlTree(['/login'], { queryParams: { returnUrl } });
};

export const guestGuard: CanMatchFn = () => {
  const user = inject(AuthService).currentUser();
  return user ? inject(Router).parseUrl(ROLE_HOME[user.role]) : true;
};

export function roleGuard(role: Role): CanMatchFn {
  return () => {
    const user = inject(AuthService).currentUser();
    const router = inject(Router);
    if (!user) {
      return router.parseUrl('/login');
    }
    if (user.role === role) {
      return true;
    }
    inject(ToastService).error("You don't have access to that page.");
    return router.parseUrl(ROLE_HOME[user.role]);
  };
}
