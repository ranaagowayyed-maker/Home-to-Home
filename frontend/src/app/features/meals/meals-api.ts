import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { concatMap, EMPTY, expand, first, map, Observable, switchMap } from 'rxjs';
import { apiUrl } from '../../core/api/api-url';
import { SKIP_AUTH } from '../../core/interceptors/auth.interceptor';
import {
  Meal,
  MealInput,
  MealPatch,
  Paged,
  PhotoContentType,
  UploadUrlResponse,
} from './meals.models';

export const MEALS_PAGE_SIZE = 50;

@Injectable({ providedIn: 'root' })
export class MealsApi {
  private readonly http = inject(HttpClient);

  mine(page = 1): Observable<Paged<Meal>> {
    return this.http.get<Paged<Meal>>(apiUrl('/meals/mine'), {
      params: { page, pageSize: MEALS_PAGE_SIZE },
    });
  }

  /** The API has no single-meal endpoint, so this pages through the mother's own meals. */
  findMine(id: string): Observable<Meal | null> {
    return this.mine(1).pipe(
      expand((p) => (p.page * p.pageSize < p.total ? this.mine(p.page + 1) : EMPTY)),
      concatMap((p) => p.items),
      first((meal) => meal.id === id, null),
    );
  }

  create(body: MealInput): Observable<Meal> {
    return this.http.post<Meal>(apiUrl('/meals'), body);
  }

  update(id: string, patch: MealPatch): Observable<Meal> {
    return this.http.patch<Meal>(apiUrl(`/meals/${encodeURIComponent(id)}`), patch);
  }

  /** Uploads the file straight to storage and resolves with its public photo URL. */
  uploadPhoto(file: File): Observable<string> {
    const contentType = file.type as PhotoContentType;
    return this.http
      .post<UploadUrlResponse>(apiUrl('/meals/upload-url'), { contentType, size: file.size })
      .pipe(
        switchMap(({ uploadUrl, photoUrl }) =>
          this.http
            .put(uploadUrl, file, {
              headers: { 'Content-Type': contentType },
              context: new HttpContext().set(SKIP_AUTH, true),
            })
            .pipe(map(() => photoUrl)),
        ),
      );
  }
}
