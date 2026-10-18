import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MoneyPipe } from '../../shared/lib/money.pipe';
import { Skeleton } from '../../shared/ui/skeleton';
import { StatusBadge } from '../../shared/ui/status-badge';
import { OrderSummary } from './orders.models';

/** Orders as rows linking to the shared order page. */
@Component({
  selector: 'app-order-summary-list',
  imports: [DatePipe, RouterLink, MoneyPipe, StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="flex flex-col gap-3">
      @for (order of orders(); track order.id) {
        <li>
          <a
            [routerLink]="['/orders', order.id]"
            class="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4 hover:border-brand-200 hover:shadow-sm"
          >
            <div class="flex items-center justify-between gap-3">
              <h2 class="font-semibold">Order #{{ order.number }}</h2>
              <app-status-badge [status]="order.status" />
            </div>
            <p class="text-sm text-stone-600">
              {{ show() === 'kitchen' ? order.kitchenName : order.customerName }} ·
              {{ order.itemCount }} {{ order.itemCount === 1 ? 'item' : 'items' }} ·
              {{ order.totalMinor | money }}
            </p>
            <p class="text-xs text-stone-500">{{ order.createdAt | date: 'MMM d, h:mm a' }}</p>
          </a>
        </li>
      }
    </ul>
  `,
})
export class OrderSummaryList {
  readonly orders = input.required<readonly OrderSummary[]>();
  /** Which party to name on each row. */
  readonly show = input<'kitchen' | 'customer'>('kitchen');
}

@Component({
  selector: 'app-order-list-skeleton',
  imports: [Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="flex flex-col gap-3" aria-label="Loading orders">
      @for (item of rows; track item) {
        <li class="flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4">
          <div class="flex justify-between">
            <app-skeleton class="h-5 w-1/3" />
            <app-skeleton class="h-6 w-20 rounded-full" />
          </div>
          <app-skeleton class="h-4 w-2/3" />
          <app-skeleton class="h-3 w-1/4" />
        </li>
      }
    </ul>
  `,
})
export class OrderListSkeleton {
  protected readonly rows = [1, 2, 3];
}
