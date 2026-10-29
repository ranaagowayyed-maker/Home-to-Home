import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { pollStream, toPollState } from '../../shared/lib/poll';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { OrderListSkeleton, OrderSummaryList } from './order-summary-list';
import { OrdersApi } from './orders-api';
import { OrderStatus } from './orders.models';

export const INCOMING_STATUSES: readonly OrderStatus[] = [
  'PLACED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'OUT_FOR_DELIVERY',
];

/** Upper bound for one polled page; the active queue of one kitchen stays well below it. */
const INCOMING_PAGE_SIZE = 50;

@Component({
  selector: 'app-incoming-orders-page',
  imports: [EmptyState, ErrorBanner, OrderListSkeleton, OrderSummaryList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex flex-col gap-6">
      <header class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold">Incoming Orders</h1>
        <p class="text-sm text-stone-600">Refreshes every 15 seconds.</p>
      </header>
      @let s = state();
      @if (s.loading) {
        <app-order-list-skeleton />
      } @else if (page(); as page) {
        @if (s.error) {
          <app-error-banner message="Couldn't refresh orders." (retry)="reload$.next()" />
        }
        @if (page.items.length === 0) {
          <app-empty-state message="No open orders right now. New orders show up here." />
        } @else {
          <app-order-summary-list [orders]="page.items" show="customer" />
        }
      } @else {
        <app-error-banner message="Couldn't load incoming orders." (retry)="reload$.next()" />
      }
    </section>
  `,
})
export class IncomingOrdersPage {
  private readonly api = inject(OrdersApi);

  protected readonly reload$ = new Subject<void>();
  protected readonly state = toPollState(
    pollStream(() => this.api.list({ status: INCOMING_STATUSES, pageSize: INCOMING_PAGE_SIZE }), {
      reload$: this.reload$,
    }),
  );
  protected readonly page = computed(() => this.state().value);
}
