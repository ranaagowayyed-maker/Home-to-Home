import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PagedList } from '../../shared/lib/paged-list';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { OrderListSkeleton, OrderSummaryList } from './order-summary-list';
import { OrdersApi } from './orders-api';
import { OrderSummary } from './orders.models';

@Component({
  selector: 'app-my-orders-page',
  imports: [RouterLink, Button, EmptyState, ErrorBanner, OrderListSkeleton, OrderSummaryList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6">
      <h1 class="text-2xl font-bold">My Orders</h1>
      @switch (orders.status()) {
        @case ('loading') {
          <app-order-list-skeleton />
        }
        @case ('error') {
          <app-error-banner message="Couldn't load your orders." (retry)="orders.load()" />
        }
        @default {
          @if (orders.items().length === 0) {
            <app-empty-state message="No orders yet. Browse meals to place your first order.">
              <a
                routerLink="/browse"
                class="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800"
              >
                Browse meals
              </a>
            </app-empty-state>
          } @else {
            <app-order-summary-list [orders]="orders.items()" show="kitchen" />
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

  protected readonly orders = new PagedList<OrderSummary>((page) => this.api.list({ page }));

  constructor() {
    this.orders.load();
  }
}
