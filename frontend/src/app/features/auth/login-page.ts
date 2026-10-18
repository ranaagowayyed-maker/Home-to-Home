import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { problemOf } from '../../core/api/problem-details';
import { ROLE_HOME } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { Button } from '../../shared/ui/button';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { Field } from '../../shared/ui/field';
import { ToastService } from '../../shared/ui/toast.service';

const CREDENTIAL_ERRORS: Record<string, string> = {
  invalid_credentials: 'Email or password is incorrect',
  rate_limited: 'Too many attempts. Try again in 15 minutes.',
};

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, Button, Field, ErrorBanner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  /** Bound from the `returnUrl` query parameter. */
  readonly returnUrl = input<string>();

  readonly form = inject(NonNullableFormBuilder).group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly submitting = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly bannerError = signal<string | null>(null);

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.formError.set(null);
    this.bannerError.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login({ email: email.trim(), password }).subscribe({
      next: (user) => {
        this.toast.success(`Welcome, ${user.name}`);
        void this.router.navigateByUrl(this.safeReturnUrl() ?? ROLE_HOME[user.role]);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        const message = CREDENTIAL_ERRORS[problemOf(error)?.code ?? ''];
        if (message) {
          this.formError.set(message);
        } else {
          this.bannerError.set("We couldn't log you in. Try again.");
        }
      },
    });
  }

  private safeReturnUrl(): string | undefined {
    const url = this.returnUrl();
    return url?.startsWith('/') && !url.startsWith('//') ? url : undefined;
  }
}
