import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ORDER_STATUS_LABELS, OrderStatus } from '../lib/order-status';

/** One color per status so every role sees the same thing (PRD 11.5). */
export const STATUS_CLASSES: Record<OrderStatus, { badge: string; dot: string }> = {
  PLACED: { badge: 'bg-sky-50 text-sky-800 ring-sky-200', dot: 'bg-sky-500' },
  PREPARING: { badge: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500' },
  READY_FOR_PICKUP: { badge: 'bg-violet-50 text-violet-800 ring-violet-200', dot: 'bg-violet-500' },
  OUT_FOR_DELIVERY: { badge: 'bg-indigo-50 text-indigo-800 ring-indigo-200', dot: 'bg-indigo-500' },
  DELIVERED: { badge: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500' },
  REJECTED: { badge: 'bg-red-50 text-red-800 ring-red-200', dot: 'bg-red-500' },
  CANCELLED: { badge: 'bg-stone-100 text-stone-700 ring-stone-300', dot: 'bg-stone-400' },
};

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[attr.data-status]': 'status()',
  },
  template: `
    <span class="size-2 shrink-0 rounded-full" [class]="dot()" aria-hidden="true"></span>
    {{ label() }}
  `,
})
export class StatusBadge {
  readonly status = input.required<OrderStatus>();

  protected readonly label = computed(() => ORDER_STATUS_LABELS[this.status()]);
  protected readonly dot = computed(() => STATUS_CLASSES[this.status()].dot);
  protected readonly classes = computed(
    () =>
      `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_CLASSES[this.status()].badge}`,
  );
}
