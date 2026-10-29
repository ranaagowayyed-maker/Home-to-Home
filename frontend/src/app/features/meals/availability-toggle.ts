import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { Spinner } from '../../shared/ui/spinner';
import { ToastService } from '../../shared/ui/toast.service';
import { ProfileApi } from '../profile/profile-api';

export const PAUSED_MESSAGE = "You're paused. Customers can't see your meals.";
export const RESUMED_MESSAGE = "You're taking orders again. Customers can see your meals.";

/** "Accepting orders" switch for the signed-in mother (P1-F004). */
@Component({
  selector: 'app-availability-toggle',
  imports: [Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'flex flex-col gap-1 rounded-xl border bg-white p-4',
    '[class.border-amber-300]': '!available()',
    '[class.border-stone-200]': 'available()',
  },
  template: `
    <button
      type="button"
      role="switch"
      class="inline-flex min-h-11 items-center gap-3 self-start rounded-lg pr-2 text-sm font-semibold disabled:opacity-60"
      [attr.aria-checked]="available()"
      [disabled]="saving()"
      (click)="toggle()"
    >
      <span
        class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors"
        [class]="available() ? 'bg-emerald-600' : 'bg-stone-300'"
      >
        <span
          class="inline-block size-5 rounded-full bg-white shadow transition-transform"
          [class]="available() ? 'translate-x-5.5' : 'translate-x-0.5'"
        ></span>
      </span>
      Accepting orders
      @if (saving()) {
        <app-spinner />
      }
    </button>
    <p
      class="text-sm"
      [class]="available() ? 'text-stone-600' : 'text-amber-800'"
      data-testid="availability-status"
    >
      {{ available() ? 'Customers can see your meals and order from you.' : pausedMessage }}
    </p>
  `,
})
export class AvailabilityToggle {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ProfileApi);
  private readonly toast = inject(ToastService);

  protected readonly pausedMessage = PAUSED_MESSAGE;
  protected readonly saving = signal(false);
  /** Shown while saving, so the switch moves at once and reverts if the save fails. */
  private readonly pending = signal<boolean | null>(null);

  protected readonly available = computed(
    () => this.pending() ?? this.auth.currentUser()?.isAvailable ?? true,
  );

  protected toggle(): void {
    if (this.saving()) {
      return;
    }
    const next = !this.available();
    this.pending.set(next);
    this.saving.set(true);
    this.api.setAvailability(next).subscribe({
      next: (value) => {
        this.pending.set(null);
        this.saving.set(false);
        this.toast.success(value ? RESUMED_MESSAGE : PAUSED_MESSAGE);
      },
      error: () => {
        this.pending.set(null);
        this.saving.set(false);
        this.toast.error("Couldn't change your availability. Try again.");
      },
    });
  }
}
