import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Role } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { ORDER_STATUS_LABELS, OrderStatus } from '../../shared/lib/order-status';
import { PagedList } from '../../shared/lib/paged-list';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { OrderListSkeleton, OrderSummaryList } from './order-summary-list';
import { OrdersApi } from './orders-api';
import { OrderSummary } from './orders.models';

interface HistoryCopy {
  title: string;
  empty: string;
  /** Which party to name on each row. */
  show: 'kitchen' | 'customer';
}

const COPY: Record<Role, HistoryCopy> = {
  CUSTOMER: {
    title: 'My Orders',
    empty: 'No orders yet. Browse meals to place your first order.',
    show: 'kitchen',
  },
  MOTHER: { title: 'Order History', empty: 'No orders received yet.', show: 'customer' },
  DELIVERY: { title: 'Order History', empty: 'No deliveries yet.', show: 'kitchen' },
};

export const STATUS_FILTERS = Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({
  value: value as OrderStatus,
  label,
}));

/** Every order the user is a party to, newest first, 20 per page (P1-F002). */
@Component({
  selector: 'app-my-orders-page',
  imports: [RouterLink, Button, EmptyState, ErrorBanner, OrderListSkeleton, OrderSummaryList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <h1 class="text-2xl font-bold">{{ copy().title }}</h1>
        <label class="flex flex-col gap-1.5 text-sm font-medium text-stone-800">
          Status
          <select
            class="input min-w-44"
            data-testid="status-filter"
            [value]="status() ?? ''"
            (change)="setStatus($any($event.target).value)"
          >
            <option value="">All statuses</option>
            @for (option of statusFilters; track option.value) {
              <option [value]="option.value">{{ option.label }}</option>
            }
          </select>
        </label>
      </header>
      @switch (orders.status()) {
        @case ('loading') {
          <app-order-list-skeleton />
        }
        @case ('error') {
          <app-error-banner message="Couldn't load your orders." (retry)="orders.load()" />
        }
        @default {
          @if (orders.reloadFailed()) {
            <app-error-banner message="Couldn't load your orders." (retry)="orders.load()" />
          }
          @if (orders.items().length === 0) {
            @if (status()) {
              <app-empty-state message="No orders with this status.">
                <button app-button variant="secondary" type="button" (click)="setStatus('')">
                  Show all orders
                </button>
              </app-empty-state>
            } @else {
              <app-empty-state [message]="copy().empty">
                @if (role() === 'CUSTOMER') {
                  <a
                    routerLink="/browse"
                    class="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
                  >
                    Browse meals
                  </a>
                }
              </app-empty-state>
            }
          } @else {
            <p class="text-sm text-stone-600" data-testid="order-count">
              {{ orders.total() }} {{ orders.total() === 1 ? 'order' : 'orders' }}
            </p>
            <app-order-summary-list [orders]="orders.items()" [show]="copy().show" />
            @if (orders.loadMoreFailed()) {
              <app-error-banner message="Couldn't load more orders." (retry)="orders.loadMore()" />
            }
            @if (orders.hasMore()) {
              <button
                app-button
                variant="secondary"
                type="button"
                [loading]="orders.loadingMore()"
                (click)="orders.loadMore()"
              >
                Load more
              </button>
            }
          }
        }
      }
    </section>
  `,
})
export class MyOrdersPage {
  private readonly api = inject(OrdersApi);
  private readonly auth = inject(AuthService);

  protected readonly role = computed(() => this.auth.currentUser()?.role ?? 'CUSTOMER');
  protected readonly copy = computed(() => COPY[this.role()]);
  protected readonly statusFilters = STATUS_FILTERS;
  protected readonly status = signal<OrderStatus | null>(null);

  protected readonly orders = new PagedList<OrderSummary>((page) => {
    const status = this.status();
    return this.api.list({ page, status: status ? [status] : undefined });
  });

  constructor() {
    this.orders.load();
  }

  protected setStatus(value: string): void {
    this.status.set((value || null) as OrderStatus | null);
    this.orders.load();
  }
}
