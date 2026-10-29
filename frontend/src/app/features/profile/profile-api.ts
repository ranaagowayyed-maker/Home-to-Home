import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { apiUrl } from '../../core/api/api-url';
import { User } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';

/** Editable profile fields; email and role are fixed at sign-up. */
export interface ProfilePatch {
  name?: string;
  phone?: string;
  /** An empty string clears the field. */
  address?: string;
  city?: string;
  /** Mothers only. */
  kitchenName?: string;
  bio?: string;
}

/** Profile and kitchen settings; every successful call refreshes the signed-in user. */
@Injectable({ providedIn: 'root' })
export class ProfileApi {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  get(): Observable<User> {
    return this.http.get<User>(apiUrl('/users/me')).pipe(tap((user) => this.auth.updateUser(user)));
  }

  update(patch: ProfilePatch): Observable<User> {
    return this.http
      .patch<User>(apiUrl('/users/me'), patch)
      .pipe(tap((user) => this.auth.updateUser(user)));
  }

  /** Mothers only: pausing hides their meals from customers and refuses new orders. */
  setAvailability(isAvailable: boolean): Observable<boolean> {
    return this.http
      .patch<{ isAvailable: boolean }>(apiUrl('/mothers/me/availability'), { isAvailable })
      .pipe(
        map((res) => res.isAvailable),
        tap((value) => {
          const user = this.auth.currentUser();
          if (user) {
            this.auth.updateUser({ ...user, isAvailable: value });
          }
        }),
      );
  }
}
