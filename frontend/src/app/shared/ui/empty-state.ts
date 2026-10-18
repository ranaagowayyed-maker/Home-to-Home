import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'flex flex-col items-center gap-4 rounded-xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center',
  },
  template: `
    <p class="text-base text-stone-700">{{ message() }}</p>
    <ng-content />
  `,
})
export class EmptyState {
  readonly message = input.required<string>();
}
