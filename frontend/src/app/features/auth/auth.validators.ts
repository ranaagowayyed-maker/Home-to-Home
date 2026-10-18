import { AbstractControl, ValidationErrors, Validators } from '@angular/forms';

export const PHONE_PATTERN = /^\+?[0-9 ]{7,20}$/;

export function passwordStrength(control: AbstractControl<string>): ValidationErrors | null {
  const value = control.value ?? '';
  if (!value) {
    return null;
  }
  return value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)
    ? null
    : { passwordStrength: true };
}

export const nameValidators = [
  Validators.required,
  Validators.minLength(2),
  Validators.maxLength(80),
];
export const kitchenNameValidators = [
  Validators.required,
  Validators.minLength(3),
  Validators.maxLength(60),
];

export const PASSWORD_MESSAGES = {
  passwordStrength: 'Use at least 8 characters with a letter and a number.',
};
export const PHONE_MESSAGES = { pattern: 'Enter a valid phone number, e.g. +20 100 123 4567.' };
