import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { applyProblemToForm, problemOf } from '../../core/api/problem-details';
import { User } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { Button } from '../../shared/ui/button';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { Field } from '../../shared/ui/field';
import { ToastService } from '../../shared/ui/toast.service';
import {
  kitchenNameValidators,
  nameValidators,
  PHONE_MESSAGES,
  PHONE_PATTERN,
} from '../auth/auth.validators';
import { ProfileApi, ProfilePatch } from './profile-api';

const ROLE_LABELS: Record<User['role'], string> = {
  CUSTOMER: 'Customer',
  MOTHER: 'Mother (home cook)',
  DELIVERY: 'Delivery person',
};

/** An empty address is allowed (it clears the saved one); otherwise 5 to 300 characters. */
const addressValidators = [Validators.minLength(5), Validators.maxLength(300)];

@Component({
  selector: 'app-profile-page',
  imports: [ReactiveFormsModule, Button, ErrorBanner, Field],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './profile-page.html',
})
export class ProfilePage {
  private readonly api = inject(ProfileApi);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly user = inject(AuthService).currentUser;
  protected readonly isMother = computed(() => this.user()?.role === 'MOTHER');
  protected readonly roleLabel = computed(() => {
    const user = this.user();
    return user ? ROLE_LABELS[user.role] : '';
  });
  protected readonly phoneMessages = PHONE_MESSAGES;

  readonly form = this.fb.group({
    name: ['', nameValidators],
    phone: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    address: ['', addressValidators],
    city: ['', Validators.maxLength(80)],
    kitchenName: ['', kitchenNameValidators],
    bio: ['', Validators.maxLength(500)],
  });

  protected readonly saving = signal(false);
  protected readonly bannerError = signal<string | null>(null);

  constructor() {
    const user = this.user();
    if (user) {
      this.fill(user);
    }
    if (!this.isMother()) {
      this.form.controls.kitchenName.disable();
      this.form.controls.bio.disable();
    }
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.saving() || this.form.invalid) {
      return;
    }
    this.saving.set(true);
    this.bannerError.set(null);
    this.api.update(this.toPatch()).subscribe({
      next: (user) => {
        this.saving.set(false);
        this.fill(user);
        this.form.markAsPristine();
        this.toast.success('Profile updated');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const problem = problemOf(error);
        if (problem?.code !== 'validation_failed' || !applyProblemToForm(this.form, problem)) {
          this.bannerError.set("Couldn't save your profile. Try again.");
        }
      },
    });
  }

  private fill(user: User): void {
    this.form.patchValue({
      name: user.name,
      phone: user.phone,
      address: user.address ?? '',
      city: user.city ?? '',
      kitchenName: user.kitchenName ?? '',
      bio: user.bio ?? '',
    });
  }

  private toPatch(): ProfilePatch {
    const value = this.form.getRawValue();
    const patch: ProfilePatch = {
      name: value.name.trim(),
      phone: value.phone.trim(),
      address: value.address.trim(),
      city: value.city.trim(),
    };
    if (this.isMother()) {
      patch.kitchenName = value.kitchenName.trim();
      patch.bio = value.bio.trim();
    }
    return patch;
  }
}
