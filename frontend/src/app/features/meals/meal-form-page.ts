import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { applyProblemToForm, problemOf } from '../../core/api/problem-details';
import { toMajorUnits, toMinorUnits } from '../../shared/lib/money';
import { Button } from '../../shared/ui/button';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { Field } from '../../shared/ui/field';
import { Skeleton } from '../../shared/ui/skeleton';
import { Spinner } from '../../shared/ui/spinner';
import { ToastService } from '../../shared/ui/toast.service';
import { photoError, PRICE_MESSAGES, priceValidator } from './meal.validators';
import { MealsApi } from './meals-api';
import {
  FORBIDDEN_MEAL_MESSAGE,
  Meal,
  MEAL_CATEGORIES,
  MEAL_PLACEHOLDER_IMAGE,
  MealCategory,
  MealInput,
} from './meals.models';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'error';

@Component({
  selector: 'app-meal-form-page',
  imports: [ReactiveFormsModule, RouterLink, Button, ErrorBanner, Field, Skeleton, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meal-form-page.html',
})
export class MealFormPage implements OnInit {
  private readonly api = inject(MealsApi);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(NonNullableFormBuilder);

  /** Bound from the `:id` route parameter; absent when creating. */
  readonly id = input<string>();

  protected readonly categories = MEAL_CATEGORIES;
  protected readonly placeholder = MEAL_PLACEHOLDER_IMAGE;
  protected readonly priceMessages = PRICE_MESSAGES;
  protected readonly forbiddenMessage = FORBIDDEN_MEAL_MESSAGE;

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(80)]],
    description: ['', Validators.maxLength(500)],
    category: this.fb.control<MealCategory>('MAIN_DISH', Validators.required),
    price: ['', [Validators.required, priceValidator]],
  });

  protected readonly loadState = signal<LoadState>('ready');
  protected readonly photoUrl = signal<string | null>(null);
  protected readonly uploading = signal(false);
  protected readonly photoError = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly bannerError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadMeal();
  }

  protected loadMeal(): void {
    const id = this.id();
    if (!id) {
      return;
    }
    this.loadState.set('loading');
    this.api.findMine(id).subscribe({
      next: (meal) => (meal ? this.fill(meal) : this.loadState.set('forbidden')),
      error: () => this.loadState.set('error'),
    });
  }

  protected onPhotoSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) {
      return;
    }
    const invalid = photoError(file);
    this.photoError.set(invalid);
    if (invalid) {
      return;
    }
    this.uploading.set(true);
    this.api
      .uploadPhoto(file)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (url) => this.photoUrl.set(url),
        error: () =>
          this.photoError.set(
            "Couldn't upload the photo. You can save the meal now and add a photo later.",
          ),
      });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving() || this.uploading()) {
      return;
    }
    this.saving.set(true);
    this.bannerError.set(null);
    const id = this.id();
    const body = this.toInput();
    (id ? this.api.update(id, body) : this.api.create(body)).subscribe({
      next: (meal) => {
        this.toast.success(id ? 'Meal updated' : `Meal '${meal.name}' published`);
        void this.router.navigateByUrl('/my-meals');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        const problem = problemOf(error);
        if (problem?.code === 'forbidden') {
          this.bannerError.set(FORBIDDEN_MEAL_MESSAGE);
        } else if (!applyProblemToForm(this.form, problem, { priceMinor: 'price' })) {
          this.bannerError.set("Couldn't save the meal. Try again.");
        }
      },
    });
  }

  private toInput(): MealInput {
    const { name, description, category, price } = this.form.getRawValue();
    const photoUrl = this.photoUrl();
    return {
      name: name.trim(),
      description: description.trim(),
      category,
      priceMinor: toMinorUnits(price.trim()),
      ...(photoUrl ? { photoUrl } : {}),
    };
  }

  private fill(meal: Meal): void {
    this.form.setValue({
      name: meal.name,
      description: meal.description,
      category: meal.category,
      price: toMajorUnits(meal.priceMinor),
    });
    this.photoUrl.set(meal.photoUrl);
    this.loadState.set('ready');
  }
}
