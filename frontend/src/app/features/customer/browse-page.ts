import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { debounceTime, map, merge } from 'rxjs';
import { toMinorUnits } from '../../shared/lib/money';
import { MoneyPipe } from '../../shared/lib/money.pipe';
import { PagedList } from '../../shared/lib/paged-list';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { Skeleton } from '../../shared/ui/skeleton';
import { MEAL_CATEGORIES, MEAL_PLACEHOLDER_IMAGE, MealCategory } from '../meals/meals.models';
import { BrowseApi } from './browse-api';
import {
  BrowseFilters,
  BrowseMeal,
  BrowseSort,
  NO_FILTERS,
  SEARCH_DEBOUNCE_MS,
  SORT_OPTIONS,
} from './browse.models';

@Component({
  selector: 'app-browse-page',
  imports: [ReactiveFormsModule, RouterLink, MoneyPipe, Button, EmptyState, ErrorBanner, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './browse-page.html',
})
export class BrowsePage {
  private readonly api = inject(BrowseApi);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly placeholder = MEAL_PLACEHOLDER_IMAGE;
  protected readonly skeletons = [1, 2, 3, 4];
  protected readonly categories = MEAL_CATEGORIES;
  protected readonly sortOptions = SORT_OPTIONS;

  readonly filters = this.fb.group({
    q: ['', Validators.maxLength(80)],
    category: ['' as MealCategory | ''],
    maxPrice: [null as number | null, Validators.min(0.01)],
    sort: ['newest' as BrowseSort],
  });

  private readonly applied = signal<BrowseFilters>(NO_FILTERS);
  protected readonly filtered = computed(() => {
    const f = this.applied();
    return f.q.trim() !== '' || f.category !== '' || f.maxPriceMinor !== null;
  });

  protected readonly meals = new PagedList<BrowseMeal>((page) =>
    this.api.list(page, this.applied()),
  );

  constructor() {
    this.meals.load();

    const { q, category, maxPrice, sort } = this.filters.controls;
    // Typing waits for a pause; picking from a list applies at once.
    merge(
      q.valueChanges.pipe(debounceTime(SEARCH_DEBOUNCE_MS)),
      maxPrice.valueChanges.pipe(debounceTime(SEARCH_DEBOUNCE_MS)),
      category.valueChanges,
      sort.valueChanges,
    )
      .pipe(
        map(() => this.read()),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((filters) => {
        if (filters && JSON.stringify(filters) !== JSON.stringify(this.applied())) {
          this.apply(filters);
        }
      });
  }

  protected clearFilters(): void {
    this.filters.reset(
      { q: '', category: '', maxPrice: null, sort: this.filters.controls.sort.value },
      { emitEvent: false },
    );
    this.apply({ ...NO_FILTERS, sort: this.filters.controls.sort.value });
  }

  /** Current form values as filters, or null while the price is invalid. */
  private read(): BrowseFilters | null {
    if (this.filters.invalid) {
      return null;
    }
    const { q, category, maxPrice, sort } = this.filters.getRawValue();
    return {
      q: q.trim(),
      category,
      maxPriceMinor: maxPrice === null ? null : toMinorUnits(maxPrice),
      sort,
    };
  }

  private apply(filters: BrowseFilters): void {
    this.applied.set(filters);
    this.meals.load();
  }
}
