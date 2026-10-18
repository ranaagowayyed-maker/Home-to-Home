import { computed, signal } from '@angular/core';
import { finalize, Observable } from 'rxjs';
import { Paged } from '../../core/api/paged';

/** Signal state for a "Load more" list over a paged endpoint. */
export class PagedList<T> {
  private page = 1;

  readonly items = signal<T[]>([]);
  readonly total = signal(0);
  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  readonly loadingMore = signal(false);
  readonly loadMoreFailed = signal(false);
  readonly hasMore = computed(() => this.items().length < this.total());

  constructor(private readonly fetch: (page: number) => Observable<Paged<T>>) {}

  load(): void {
    this.status.set('loading');
    this.loadMoreFailed.set(false);
    this.fetch(1).subscribe({
      next: (result) => {
        this.page = 1;
        this.items.set(result.items);
        this.total.set(result.total);
        this.status.set('ready');
      },
      error: () => this.status.set('error'),
    });
  }

  loadMore(): void {
    if (this.loadingMore()) {
      return;
    }
    this.loadingMore.set(true);
    this.loadMoreFailed.set(false);
    this.fetch(this.page + 1)
      .pipe(finalize(() => this.loadingMore.set(false)))
      .subscribe({
        next: (result) => {
          this.page = result.page;
          this.items.update((list) => [...list, ...result.items]);
          this.total.set(result.total);
        },
        error: () => this.loadMoreFailed.set(true),
      });
  }
}
