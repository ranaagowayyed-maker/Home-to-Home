import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/api/api-url';
import { Paged } from '../../core/api/paged';
import { BROWSE_PAGE_SIZE, BrowseMeal } from './browse.models';

@Injectable({ providedIn: 'root' })
export class BrowseApi {
  private readonly http = inject(HttpClient);

  /** Visible meals of available mothers, newest first. */
  list(page = 1): Observable<Paged<BrowseMeal>> {
    return this.http.get<Paged<BrowseMeal>>(apiUrl('/meals'), {
      params: { page, pageSize: BROWSE_PAGE_SIZE },
    });
  }

  get(id: string): Observable<BrowseMeal> {
    return this.http.get<BrowseMeal>(apiUrl(`/meals/${encodeURIComponent(id)}`));
  }
}
