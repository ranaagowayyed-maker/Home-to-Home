import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { problemOf } from '../../core/api/problem-details';
import { MoneyPipe } from '../../shared/lib/money.pipe';
import { Button } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { Skeleton } from '../../shared/ui/skeleton';
import { Spinner } from '../../shared/ui/spinner';
import { ToastService } from '../../shared/ui/toast.service';
import { MealsApi } from './meals-api';
import {
  CATEGORY_LABELS,
  FORBIDDEN_MEAL_MESSAGE,
  Meal,
  MEAL_PLACEHOLDER_IMAGE,
  MealPatch,
} from './meals.models';

interface ActionError {
  message: string;
  retry: () => void;
}

@Component({
  selector: 'app-my-meals-page',
  imports: [
    RouterLink,
    MoneyPipe,
    Button,
    ConfirmDialog,
    EmptyState,
    ErrorBanner,
    Skeleton,
    Spinner,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './my-meals-page.html',
})
export class MyMealsPage {
  private readonly api = inject(MealsApi);
  private readonly toast = inject(ToastService);
  private page = 1;

  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly placeholder = MEAL_PLACEHOLDER_IMAGE;
  protected readonly skeletons = [1, 2, 3];

  protected readonly meals = signal<Meal[]>([]);
  protected readonly total = signal(0);
  protected readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly loadingMore = signal(false);
  protected readonly pendingIds = signal<ReadonlySet<string>>(new Set());
  protected readonly archiveTarget = signal<Meal | null>(null);
  protected readonly actionError = signal<ActionError | null>(null);

  protected readonly hasMore = computed(() => this.meals().length < this.total());
  protected readonly archiving = computed(() => {
    const target = this.archiveTarget();
    return target !== null && this.pendingIds().has(target.id);
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.status.set('loading');
    this.api.mine(1).subscribe({
      next: (result) => {
        this.page = 1;
        this.meals.set(result.items);
        this.total.set(result.total);
        this.status.set('ready');
      },
      error: () => this.status.set('error'),
    });
  }

  protected loadMore(): void {
    this.loadingMore.set(true);
    this.api
      .mine(this.page + 1)
      .pipe(finalize(() => this.loadingMore.set(false)))
      .subscribe({
        next: (result) => {
          this.page = result.page;
          this.meals.update((list) => [...list, ...result.items]);
          this.total.set(result.total);
        },
        error: () =>
          this.actionError.set({
            message: "Couldn't load more meals.",
            retry: () => this.loadMore(),
          }),
      });
  }

  protected isPending(meal: Meal): boolean {
    return this.pendingIds().has(meal.id);
  }

  protected toggleVisibility(meal: Meal): void {
    const isVisible = !meal.isVisible;
    this.mutate(meal, { isVisible }, (updated) => {
      this.meals.update((list) => list.map((m) => (m.id === updated.id ? updated : m)));
      this.toast.success(`'${updated.name}' is now ${isVisible ? 'visible' : 'hidden'}`);
    });
  }

  protected confirmArchive(): void {
    const meal = this.archiveTarget();
    if (!meal) {
      return;
    }
    this.mutate(meal, { isArchived: true }, () => {
      this.archiveTarget.set(null);
      this.meals.update((list) => list.filter((m) => m.id !== meal.id));
      this.total.update((n) => n - 1);
      this.toast.success(`Meal '${meal.name}' archived`);
    });
  }

  private mutate(meal: Meal, patch: MealPatch, onSuccess: (updated: Meal) => void): void {
    this.actionError.set(null);
    this.setPending(meal.id, true);
    this.api
      .update(meal.id, patch)
      .pipe(finalize(() => this.setPending(meal.id, false)))
      .subscribe({
        next: onSuccess,
        error: (error: unknown) => {
          this.archiveTarget.set(null);
          this.actionError.set({
            message:
              problemOf(error)?.code === 'forbidden'
                ? FORBIDDEN_MEAL_MESSAGE
                : "Couldn't update the meal. Try again.",
            retry: () => this.mutate(meal, patch, onSuccess),
          });
        },
      });
  }

  private setPending(id: string, pending: boolean): void {
    this.pendingIds.update((ids) => {
      const next = new Set(ids);
      if (pending) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }
}
