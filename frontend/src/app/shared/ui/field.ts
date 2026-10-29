import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { map, of, startWith, switchMap } from 'rxjs';

const DEFAULT_MESSAGES: Record<string, (error: unknown) => string> = {
  required: () => 'This field is required.',
  email: () => 'Enter a valid email address.',
  minlength: (e) => `Use at least ${(e as { requiredLength: number }).requiredLength} characters.`,
  maxlength: (e) => `Use at most ${(e as { requiredLength: number }).requiredLength} characters.`,
};

export function errorMessage(
  errors: ValidationErrors | null,
  overrides: Record<string, string> = {},
): string | null {
  const key = errors ? Object.keys(errors)[0] : undefined;
  if (!errors || !key) {
    return null;
  }
  if (key === 'server') {
    return String(errors[key]);
  }
  return overrides[key] ?? DEFAULT_MESSAGES[key]?.(errors[key]) ?? 'Check this field.';
}

@Component({
  selector: 'app-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col gap-1.5' },
  template: `
    <label [for]="for()" class="text-sm font-medium text-stone-800">{{ label() }}</label>
    <ng-content />
    @if (error(); as message) {
      <p [id]="for() + '-error'" class="text-sm text-red-700">{{ message }}</p>
    } @else if (hint()) {
      <p [id]="for() + '-hint'" class="text-sm text-stone-500">{{ hint() }}</p>
    }
  `,
})
export class Field {
  readonly label = input.required<string>();
  readonly for = input.required<string>();
  readonly control = input<AbstractControl | null>(null);
  readonly messages = input<Record<string, string>>({});
  readonly hint = input<string>();
  /** External error (e.g. a non-form field such as a file input). Takes precedence. */
  readonly errorText = input<string | null>(null);

  private readonly controlError = toSignal(
    toObservable(this.control).pipe(
      switchMap((control) =>
        control
          ? control.events.pipe(
              startWith(null),
              map(() =>
                control.invalid && (control.touched || control.dirty)
                  ? errorMessage(control.errors, this.messages())
                  : null,
              ),
            )
          : of(null),
      ),
    ),
    { initialValue: null },
  );

  protected readonly error = computed(() => this.errorText() ?? this.controlError());
}
