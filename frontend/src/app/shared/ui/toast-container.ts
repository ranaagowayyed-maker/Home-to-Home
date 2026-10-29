import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastKind, ToastService } from './toast.service';

const KIND_CLASSES: Record<ToastKind, string> = {
  success: 'bg-emerald-700 text-white',
  error: 'bg-red-700 text-white',
  info: 'bg-stone-800 text-white',
};

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4',
    role: 'status',
    'aria-live': 'polite',
  },
  template: `
    @for (toast of toasts.toasts(); track toast.id) {
      <div
        class="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-lg px-4 py-3 shadow-lg {{
          kindClasses[toast.kind]
        }}"
      >
        <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
        <button
          type="button"
          class="-mr-2 inline-flex size-11 items-center justify-center rounded-md hover:bg-white/10"
          aria-label="Dismiss"
          (click)="toasts.dismiss(toast.id)"
        >
          ✕
        </button>
      </div>
    }
  `,
})
export class ToastContainer {
  protected readonly toasts = inject(ToastService);
  protected readonly kindClasses = KIND_CLASSES;
}
