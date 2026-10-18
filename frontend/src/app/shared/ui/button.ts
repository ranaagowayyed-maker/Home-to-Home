import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Spinner } from './spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-ghost';

const BASE =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800',
  secondary: 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  'danger-ghost': 'text-red-700 hover:bg-red-50',
};

@Component({
  selector: 'button[app-button]',
  imports: [Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'classes()',
    '[disabled]': 'disabled() || loading()',
    '[attr.aria-busy]': 'loading() || null',
  },
  template: `
    @if (loading()) {
      <app-spinner />
    }
    <ng-content />
  `,
})
export class Button {
  readonly variant = input<ButtonVariant>('primary');
  readonly loading = input(false);
  readonly disabled = input(false);

  protected readonly classes = computed(() => `${BASE} ${VARIANTS[this.variant()]}`);
}
