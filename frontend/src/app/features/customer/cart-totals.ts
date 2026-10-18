import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CartService } from '../../core/cart/cart.service';
import { ConfigService } from '../../core/config/config.service';
import { MoneyPipe } from '../../shared/lib/money.pipe';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { Skeleton } from '../../shared/ui/skeleton';

/** Subtotal, flat delivery fee from GET /config, and total. */
@Component({
  selector: 'app-cart-totals',
  imports: [MoneyPipe, ErrorBanner, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-2' },
  template: `
    @let fee = config.deliveryFeeMinor();
    <dl class="flex flex-col gap-2 text-sm">
      <div class="flex justify-between">
        <dt class="text-stone-600">Subtotal</dt>
        <dd>{{ cart.subtotalMinor() | money }}</dd>
      </div>
      <div class="flex justify-between">
        <dt class="text-stone-600">Delivery fee</dt>
        <dd>
          @if (fee !== null) {
            {{ fee | money }}
          } @else {
            <app-skeleton class="h-4 w-14" />
          }
        </dd>
      </div>
      <div class="flex justify-between border-t border-stone-200 pt-2 text-base font-semibold">
        <dt>Total</dt>
        <dd data-testid="cart-total">
          @if (fee !== null) {
            {{ cart.totalMinor(fee) | money }}
          } @else {
            <app-skeleton class="h-5 w-16" />
          }
        </dd>
      </div>
    </dl>
    @if (config.status() === 'error') {
      <app-error-banner message="Couldn't load the delivery fee." (retry)="config.load()" />
    }
  `,
})
export class CartTotals {
  protected readonly cart = inject(CartService);
  protected readonly config = inject(ConfigService);

  constructor() {
    this.config.load();
  }
}
