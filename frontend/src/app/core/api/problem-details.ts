import { HttpErrorResponse } from '@angular/common/http';
import { FormGroup } from '@angular/forms';

export type ProblemCode =
  | 'validation_failed'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'email_taken'
  | 'invalid_credentials'
  | 'rate_limited'
  | 'invalid_refresh_token'
  | 'storage_unavailable'
  | 'meal_unavailable'
  | 'kitchen_paused'
  | 'invalid_transition'
  | 'order_changed'
  | 'delivery_taken'
  | 'request_closed'
  | 'active_limit';

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  code: ProblemCode | (string & {});
  errors?: Record<string, string[]>;
  /** Extension on 409 `meal_unavailable` and `kitchen_paused` from POST /orders. */
  unavailableMealIds?: string[];
}

export function problemOf(error: unknown): ProblemDetails | null {
  if (!(error instanceof HttpErrorResponse)) {
    return null;
  }
  const body: unknown = error.error;
  return body !== null && typeof body === 'object' && 'code' in body
    ? (body as ProblemDetails)
    : null;
}

/**
 * Copies server field errors onto matching form controls as a `server` error.
 * `aliases` maps API field names to control names (e.g. priceMinor → price).
 * Returns true when at least one error was applied.
 */
export function applyProblemToForm(
  form: FormGroup,
  problem: ProblemDetails | null,
  aliases: Record<string, string> = {},
): boolean {
  let applied = false;
  for (const [field, messages] of Object.entries(problem?.errors ?? {})) {
    const name = field.charAt(0).toLowerCase() + field.slice(1);
    const control = form.get(aliases[name] ?? name);
    if (control && messages.length > 0) {
      control.setErrors({ server: messages[0] });
      control.markAsTouched();
      applied = true;
    }
  }
  return applied;
}
