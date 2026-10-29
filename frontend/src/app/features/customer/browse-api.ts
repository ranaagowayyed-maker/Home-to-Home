import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/api/api-url';
import { Paged } from '../../core/api/paged';
import { BROWSE_PAGE_SIZE, BrowseFilters, BrowseMeal, NO_FILTERS } from './browse.models';

@Injectable({ providedIn: 'root' })
export class BrowseApi {
  private readonly http = inject(HttpClient);

  /** Visible meals of available mothers matching every filter given. */
  list(page = 1, filters: BrowseFilters = NO_FILTERS): Observable<Paged<BrowseMeal>> {
    const params: Record<string, string | number> = { page, pageSize: BROWSE_PAGE_SIZE };
    if (filters.q.trim()) {
      params['q'] = filters.q.trim();
    }
    if (filters.category) {
      params['category'] = filters.category;
    }
    if (filters.maxPriceMinor !== null) {
      params['maxPriceMinor'] = filters.maxPriceMinor;
    }
    if (filters.sort !== 'newest') {
      params['sort'] = filters.sort;
    }
    return this.http.get<Paged<BrowseMeal>>(apiUrl('/meals'), { params });
  }

  get(id: string): Observable<BrowseMeal> {
    return this.http.get<BrowseMeal>(apiUrl(`/meals/${encodeURIComponent(id)}`));
  }
}
