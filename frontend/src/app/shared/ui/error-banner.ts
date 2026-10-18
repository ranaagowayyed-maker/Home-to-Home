import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Button } from './button';

@Component({
  selector: 'app-error-banner',
  imports: [Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 sm:flex-row sm:items-center',
    role: 'alert',
  },
  template: `
    <p class="flex-1 text-sm font-medium">{{ message() }}</p>
    @if (retryable()) {
      <button
        app-button
        variant="secondary"
        type="button"
        [loading]="retrying()"
        (click)="retry.emit()"
      >
        Retry
      </button>
    }
  `,
})
export class ErrorBanner {
  readonly message = input.required<string>();
  readonly retryable = input(true);
  readonly retrying = input(false);
  readonly retry = output();
}
