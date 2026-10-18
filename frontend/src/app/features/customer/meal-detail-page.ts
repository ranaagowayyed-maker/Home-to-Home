import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { problemOf } from '../../core/api/problem-details';
import { MAX_QUANTITY, MIN_QUANTITY } from '../../core/cart/cart.models';
import { CartService } from '../../core/cart/cart.service';
import { MoneyPipe } from '../../shared/lib/money.pipe';
import { Button } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { Skeleton } from '../../shared/ui/skeleton';
import { ToastService } from '../../shared/ui/toast.service';
import { CATEGORY_LABELS, MEAL_PLACEHOLDER_IMAGE } from '../meals/meals.models';
import { BrowseApi } from './browse-api';
import { BrowseMeal, NEW_CART_MESSAGE, NEW_CART_TITLE } from './browse.models';

type LoadState = 'loading' | 'ready' | 'not-found' | 'error';

@Component({
  selector: 'app-meal-detail-page',
  imports: [RouterLink, MoneyPipe, Button, ConfirmDialog, ErrorBanner, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meal-detail-page.html',
})
export class MealDetailPage implements OnInit {
  private readonly api = inject(BrowseApi);
  private readonly toast = inject(ToastService);
  protected readonly cart = inject(CartService);

  /** Bound from the `:id` route parameter. */
  readonly id = input.required<string>();

  protected readonly placeholder = MEAL_PLACEHOLDER_IMAGE;
  protected readonly categoryLabels = CATEGORY_LABELS;
  protected readonly newCartTitle = NEW_CART_TITLE;
  protected readonly newCartMessage = NEW_CART_MESSAGE;
  protected readonly min = MIN_QUANTITY;
  protected readonly max = MAX_QUANTITY;

  protected readonly meal = signal<BrowseMeal | null>(null);
  protected readonly loadState = signal<LoadState>('loading');
  protected readonly quantity = signal(MIN_QUANTITY);
  protected readonly confirmNewCart = signal(false);

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.loadState.set('loading');
    this.api.get(this.id()).subscribe({
      next: (meal) => {
        this.meal.set(meal);
        this.loadState.set('ready');
      },
      error: (error: unknown) =>
        this.loadState.set(problemOf(error)?.code === 'not_found' ? 'not-found' : 'error'),
    });
  }

  protected step(delta: number): void {
    this.quantity.update((q) => Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, q + delta)));
  }

  protected addToCart(): void {
    const meal = this.meal();
    if (!meal) {
      return;
    }
    if (this.cart.add(meal, this.quantity()) === 'conflict') {
      this.confirmNewCart.set(true);
      return;
    }
    this.added(meal);
  }

  protected startNewCart(): void {
    const meal = this.meal();
    this.confirmNewCart.set(false);
    if (meal) {
      this.cart.replaceWith(meal, this.quantity());
      this.added(meal);
    }
  }

  private added(meal: BrowseMeal): void {
    this.toast.success(`Added ${this.quantity()} × ${meal.name} to your cart`);
    this.quantity.set(MIN_QUANTITY);
  }
}
