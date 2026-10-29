import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize, Subject } from 'rxjs';
import { problemOf } from '../../core/api/problem-details';
import { MoneyPipe } from '../../shared/lib/money.pipe';
import { pollStream, toPollState } from '../../shared/lib/poll';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { ToastService } from '../../shared/ui/toast.service';
import { OrderListSkeleton } from '../orders/order-summary-list';
import { NO_ACCESS_MESSAGE } from '../orders/orders.models';
import { DeliveryApi } from './delivery-api';
import { ACTIVE_LIMIT_MESSAGE, DeliveryRequestSummary } from './delivery.models';

interface Banner {
  message: string;
  retry?: () => void;
}

/** 409 codes from POST /delivery-requests/:id/accept: the list is stale, so refresh it. */
const CONFLICT_MESSAGES: Record<string, string> = {
  delivery_taken: 'This delivery was just taken.',
  request_closed: 'This request is no longer available.',
  active_limit: ACTIVE_LIMIT_MESSAGE,
};

@Component({
  selector: 'app-available-deliveries-page',
  imports: [RouterLink, MoneyPipe, Button, EmptyState, ErrorBanner, OrderListSkeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './available-deliveries-page.html',
})
export class AvailableDeliveriesPage {
  private readonly api = inject(DeliveryApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly limitMessage = ACTIVE_LIMIT_MESSAGE;
  protected readonly reload$ = new Subject<void>();
  protected readonly state = toPollState(
    pollStream(() => this.api.available(), { reload$: this.reload$ }),
  );
  protected readonly list = computed(() => this.state().value);
  protected readonly atLimit = computed(() => {
    const list = this.list();
    return list !== null && list.activeDeliveries >= list.maxActiveDeliveries;
  });

  protected readonly acceptingId = signal<string | null>(null);
  protected readonly banner = signal<Banner | null>(null);

  accept(request: DeliveryRequestSummary): void {
    if (this.acceptingId() || this.atLimit()) {
      return;
    }
    this.acceptingId.set(request.id);
    this.banner.set(null);
    this.api
      .accept(request.id)
      .pipe(finalize(() => this.acceptingId.set(null)))
      .subscribe({
        next: (order) => {
          this.toast.success('Delivery accepted');
          void this.router.navigate(['/orders', order.id]);
        },
        error: (error: unknown) => {
          const problem = problemOf(error);
          const conflict = problem ? CONFLICT_MESSAGES[problem.code] : undefined;
          if (conflict) {
            this.banner.set({ message: conflict });
            this.reload$.next();
          } else if (problem?.code === 'forbidden') {
            this.banner.set({ message: NO_ACCESS_MESSAGE });
          } else {
            this.banner.set({
              message: "Couldn't accept the delivery. Try again.",
              retry: () => this.accept(request),
            });
          }
        },
      });
  }
}
