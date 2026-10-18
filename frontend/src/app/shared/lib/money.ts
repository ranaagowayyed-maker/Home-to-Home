import { environment } from '../../../environments/environment';

export function formatMoney(minor: number, currency: string = environment.currency): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

export function toMinorUnits(major: string | number): number {
  return Math.round(Number(major) * 100);
}

export function toMajorUnits(minor: number): string {
  return (minor / 100).toFixed(2);
}
