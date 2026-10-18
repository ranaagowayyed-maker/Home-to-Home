import { AbstractControl, ValidationErrors } from '@angular/forms';
import { PhotoContentType } from './meals.models';

const PRICE_PATTERN = /^\d+(\.\d{1,2})?$/;
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
export const PHOTO_TYPES: readonly PhotoContentType[] = ['image/jpeg', 'image/png'];

export function priceValidator(control: AbstractControl<string>): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (!value) {
    return null;
  }
  if (!PRICE_PATTERN.test(value)) {
    return { priceFormat: true };
  }
  return Number(value) > 0 ? null : { pricePositive: true };
}

export const PRICE_MESSAGES = {
  priceFormat: 'Enter a price like 12.50.',
  pricePositive: 'Price must be greater than 0.',
};

export function photoError(file: File): string | null {
  if (!PHOTO_TYPES.includes(file.type as PhotoContentType)) {
    return 'Choose a JPEG or PNG image.';
  }
  return file.size > MAX_PHOTO_BYTES ? 'Photo must be 5 MB or smaller.' : null;
}
