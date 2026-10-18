import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, Subject, switchMap } from 'rxjs';
import { problemOf } from '../../core/api/problem-details';
import { Role } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { MoneyPipe } from '../../shared/lib/money.pipe';
import { isTerminalStatus, ORDER_STATUS_LABELS } from '../../shared/lib/order-status';
import { pollStream, toPollState } from '../../shared/lib/poll';
import { Button, ButtonVariant } from '../../shared/ui/button';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { Skeleton } from '../../shared/ui/skeleton';
import { STATUS_CLASSES, StatusBadge } from '../../shared/ui/status-badge';
import { ToastService } from '../../shared/ui/toast.service';
import { OrdersApi } from './orders-api';
import {
  ACTION_LABELS,
  ACTION_TOASTS,
  DESTRUCTIVE_ACTIONS,
  NO_ACCESS_MESSAGE,
  OrderDetail,
  OrderStatus,
} from './orders.models';

interface Banner {
  message: string;
  retry?: () => void;
}

interface OrderAction {
  status: OrderStatus;
  label: string;
  variant: ButtonVariant;
}

const BACK_LINKS: Record<Role, { label: string; path: string }> = {
  CUSTOMER: { label: 'My Orders', path: '/orders' },
  MOTHER: { label: 'Incoming Orders', path: '/incoming-orders' },
  DELIVERY: { label: 'My Deliveries', path: '/deliveries/mine' },
};

const CONFIRMATIONS: Partial<Record<OrderStatus, { title: string; message: string }>> = {
  REJECTED: {
    title: 'Reject this order?',
    message: "The customer will be told your kitchen couldn't take this order.",
  },
  CANCELLED: {
    title: 'Cancel this order?',
    message: "The kitchen will be told you cancelled it. This can't be undone.",
  },
};

const httpStatus = (error: unknown): number | null =>
  error instanceof HttpErrorResponse ? error.status : null;

@Component({
  selector: 'app-order-page',
  imports: [
    DatePipe,
    RouterLink,
    MoneyPipe,
    Button,
    ConfirmDialog,
    ErrorBanner,
    Skeleton,
    StatusBadge,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './order-page.html',
})
export class OrderPage {
  private readonly api = inject(OrdersApi);
  private readonly toast = inject(ToastService);
  private readonly auth = inject(AuthService);

  /** Bound from the `:id` route parameter. */
  readonly id = input.required<string>();

  protected readonly statusLabels = ORDER_STATUS_LABELS;
  protected readonly statusClasses = STATUS_CLASSES;
  protected readonly noAccessMessage = NO_ACCESS_MESSAGE;
  protected readonly role = computed(() => this.auth.currentUser()?.role ?? null);
  protected readonly backLink = computed(() => {
    const role = this.role();
    return role ? BACK_LINKS[role] : null;
  });

  private readonly reload$ = new Subject<void>();
  private readonly push$ = new Subject<OrderDetail>();

  /** GET /orders/:id every 15 s until the order reaches a terminal status. */
  protected readonly state = toPollState(
    toObservable(this.id).pipe(
      switchMap((id) =>
        pollStream(() => this.api.get(id), {
          reload$: this.reload$,
          push$: this.push$,
          stopWhen: (order) => isTerminalStatus(order.status),
          stopOnError: (error) => [403, 404].includes(httpStatus(error) ?? 0),
        }),
      ),
    ),
  );

  protected readonly order = computed(() => this.state().value);
  protected readonly loadError = computed(() => {
    const { error } = this.state();
    if (!error) {
      return null;
    }
    const status = httpStatus(error);
    return status === 403 ? 'forbidden' : status === 404 ? 'not-found' : 'failed';
  });

  /** Rendered strictly from the server's allowedActions. */
  protected readonly actions = computed<OrderAction[]>(() =>
    (this.order()?.allowedActions ?? []).flatMap((status) => {
      const label = ACTION_LABELS[status];
      if (!label) {
        return [];
      }
      const variant: ButtonVariant = DESTRUCTIVE_ACTIONS.includes(status)
        ? 'danger-ghost'
        : 'primary';
      return [{ status, label, variant }];
    }),
  );

  protected readonly pending = signal<OrderStatus | null>(null);
  protected readonly confirmTarget = signal<OrderStatus | null>(null);
  protected readonly banner = signal<Banner | null>(null);
  protected readonly confirmation = computed(() => {
    const target = this.confirmTarget();
    return target ? (CONFIRMATIONS[target] ?? null) : null;
  });

  protected reload(): void {
    this.reload$.next();
  }

  protected act(status: OrderStatus): void {
    if (DESTRUCTIVE_ACTIONS.includes(status)) {
      this.confirmTarget.set(status);
    } else {
      this.run(status);
    }
  }

  protected confirm(): void {
    const target = this.confirmTarget();
    if (target) {
      this.run(target);
    }
  }

  private run(status: OrderStatus): void {
    const order = this.order();
    if (!order || this.pending()) {
      return;
    }
    this.pending.set(status);
    this.banner.set(null);
    this.api
      .updateStatus(order.id, status)
      .pipe(
        finalize(() => {
          this.pending.set(null);
          this.confirmTarget.set(null);
        }),
      )
      .subscribe({
        next: (updated) => {
          this.push$.next(updated);
          this.toast.success(`Order #${updated.number} ${ACTION_TOASTS[status] ?? 'updated'}`);
        },
        error: (error: unknown) => this.handleActionError(error, status),
      });
  }

  private handleActionError(error: unknown, status: OrderStatus): void {
    const code = problemOf(error)?.code;
    if (code === 'invalid_transition' || code === 'order_changed') {
      this.reload$.next();
      this.banner.set({
        message:
          status === 'CANCELLED' && code === 'invalid_transition'
            ? 'The kitchen already started preparing this order.'
            : 'This order was just updated. Showing the latest status.',
      });
    } else if (httpStatus(error) === 403) {
      this.banner.set({ message: NO_ACCESS_MESSAGE });
    } else {
      this.banner.set({
        message: "Couldn't update the status. Try again.",
        retry: () => this.run(status),
      });
    }
  }
}
