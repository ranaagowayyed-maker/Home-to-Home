import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { applyProblemToForm, problemOf } from '../../core/api/problem-details';
import { RegisterRequest, Role, ROLE_HOME } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { Button } from '../../shared/ui/button';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { Field } from '../../shared/ui/field';
import { ToastService } from '../../shared/ui/toast.service';
import {
  kitchenNameValidators,
  nameValidators,
  PASSWORD_MESSAGES,
  passwordStrength,
  PHONE_MESSAGES,
  PHONE_PATTERN,
} from './auth.validators';

interface RoleOption {
  value: Role;
  label: string;
  description: string;
}

const ROLES: readonly Role[] = ['CUSTOMER', 'MOTHER', 'DELIVERY'];

@Component({
  selector: 'app-signup-page',
  imports: [ReactiveFormsModule, RouterLink, Button, Field, ErrorBanner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './signup-page.html',
})
export class SignupPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly roleOptions: RoleOption[] = [
    { value: 'CUSTOMER', label: 'Customer', description: 'I want to order meals' },
    { value: 'MOTHER', label: 'Mother', description: 'I cook and sell meals' },
    { value: 'DELIVERY', label: 'Delivery', description: 'I deliver orders' },
  ];
  protected readonly passwordMessages = PASSWORD_MESSAGES;
  protected readonly phoneMessages = PHONE_MESSAGES;

  readonly form = this.fb.group({
    role: this.fb.control<Role>(this.initialRole(), Validators.required),
    name: ['', nameValidators],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    password: ['', [Validators.required, passwordStrength]],
    kitchenName: [''],
  });

  protected readonly role = toSignal(this.form.controls.role.valueChanges, {
    initialValue: this.form.controls.role.value,
  });
  protected readonly submitting = signal(false);
  protected readonly bannerError = signal<string | null>(null);

  constructor() {
    this.syncKitchenNameValidators(this.form.controls.role.value);
    this.form.controls.role.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((role) => this.syncKitchenNameValidators(role));
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) {
      return;
    }
    this.submitting.set(true);
    this.bannerError.set(null);
    this.auth.register(this.toRequest()).subscribe({
      next: (user) => {
        this.toast.success(`Welcome, ${user.name}`);
        void this.router.navigateByUrl(ROLE_HOME[user.role]);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        const problem = problemOf(error);
        if (problem?.code === 'email_taken') {
          this.form.controls.email.setErrors({
            server: 'This email is already registered. Log in instead.',
          });
        } else if (!applyProblemToForm(this.form, problem)) {
          this.bannerError.set("We couldn't create your account. Try again.");
        }
      },
    });
  }

  private toRequest(): RegisterRequest {
    const { kitchenName, ...value } = this.form.getRawValue();
    return {
      ...value,
      name: value.name.trim(),
      email: value.email.trim(),
      ...(value.role === 'MOTHER' ? { kitchenName: kitchenName.trim() } : {}),
    };
  }

  private syncKitchenNameValidators(role: Role): void {
    const control = this.form.controls.kitchenName;
    control.setValidators(role === 'MOTHER' ? kitchenNameValidators : null);
    control.updateValueAndValidity();
  }

  private initialRole(): Role {
    const param = inject(ActivatedRoute).snapshot.queryParamMap.get('role');
    return ROLES.find((r) => r === param) ?? 'CUSTOMER';
  }
}
