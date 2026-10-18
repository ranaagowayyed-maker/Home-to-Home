import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { applyProblemToForm, problemOf } from '../../core/api/problem-details';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { MoneyPipe } from '../../shared/lib/money.pipe';
import { newIdempotencyKey } from '../../shared/lib/idempotency-key';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { Field } from '../../shared/ui/field';
import { ToastService } from '../../shared/ui/toast.service';
import { PHONE_MESSAGES, PHONE_PATTERN } from '../auth/auth.validators';
import { OrdersApi } from '../orders/orders-api';
import { NO_ACCESS_MESSAGE, PlaceOrderRequest } from '../orders/orders.models';
import { CartTotals } from './cart-totals';

interface Banner {
  message: string;
  retryable: boolean;
}

@Component({
  selector: 'app-checkout-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MoneyPipe,
    Button,
    CartTotals,
    EmptyState,
    ErrorBanner,
    Field,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './checkout-page.html',
})
export class CheckoutPage {
  private readonly api = inject(OrdersApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);
  protected readonly cart = inject(CartService);

  protected readonly phoneMessages = PHONE_MESSAGES;

  /**
   * Generated once when checkout opens and sent with every attempt, so a double click or a
   * retry after a network failure can never create a second order.
   */
  private idempotencyKey = newIdempotencyKey();

  readonly form = this.fb.group({
    deliveryAddress: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(300)],
    ],
    customerPhone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    notes: ['', Validators.maxLength(500)],
  });

  protected readonly placing = signal(false);
  protected readonly banner = signal<Banner | null>(null);

  constructor() {
    const user = inject(AuthService).currentUser();
    this.form.patchValue({
      deliveryAddress: [user?.address, user?.city].filter(Boolean).join(', '),
      customerPhone: user?.phone ?? '',
    });
  }

  placeOrder(): void {
    this.form.markAllAsTouched();
    if (this.placing() || this.form.invalid || this.cart.isEmpty() || this.cart.hasUnavailable()) {
      return;
    }
    this.placing.set(true);
    this.banner.set(null);
    this.api.place(this.toRequest(), this.idempotencyKey).subscribe({
      next: (order) => {
        this.cart.clear();
        this.toast.success(`Order #${order.number} placed`);
        void this.router.navigate(['/orders', order.id]);
      },
      error: (error: unknown) => {
        this.placing.set(false);
        this.handleError(error);
      },
    });
  }

  protected removeUnavailable(): void {
    this.cart.removeUnavailable();
    // The rejected request created nothing and the cart is now different: this is a new order.
    this.idempotencyKey = newIdempotencyKey();
    this.banner.set(null);
  }

  private handleError(error: unknown): void {
    const problem = problemOf(error);
    switch (problem?.code) {
      case 'meal_unavailable':
        this.cart.markUnavailable(problem.unavailableMealIds ?? []);
        return;
      case 'forbidden':
        this.banner.set({ message: NO_ACCESS_MESSAGE, retryable: false });
        return;
      case 'validation_failed': {
        const itemsError = problem.errors?.['items']?.[0];
        if (itemsError) {
          this.banner.set({ message: itemsError, retryable: false });
        } else if (!applyProblemToForm(this.form, problem)) {
          this.banner.set({ message: "Couldn't place your order. Try again.", retryable: true });
        }
        return;
      }
      default:
        this.banner.set({ message: "Couldn't place your order. Try again.", retryable: true });
    }
  }

  private toRequest(): PlaceOrderRequest {
    const { deliveryAddress, customerPhone, notes } = this.form.getRawValue();
    return {
      items: this.cart.items().map((item) => ({ mealId: item.mealId, quantity: item.quantity })),
      deliveryAddress: deliveryAddress.trim(),
      customerPhone: customerPhone.trim(),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
  }
}
