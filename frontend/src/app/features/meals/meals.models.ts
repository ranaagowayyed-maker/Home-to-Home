export type MealCategory = 'MAIN_DISH' | 'APPETIZER' | 'DESSERT' | 'PASTRY' | 'DRINK' | 'OTHER';

export interface Meal {
  id: string;
  name: string;
  description: string;
  category: MealCategory;
  priceMinor: number;
  photoUrl: string | null;
  isVisible: boolean;
  isArchived: boolean;
  createdAt: string;
}

export type { Paged } from '../../core/api/paged';

export interface MealInput {
  name: string;
  description: string;
  category: MealCategory;
  priceMinor: number;
  photoUrl?: string;
}

export type MealPatch = Partial<MealInput> & { isVisible?: boolean; isArchived?: boolean };

export type PhotoContentType = 'image/jpeg' | 'image/png';

export interface UploadUrlResponse {
  uploadUrl: string;
  photoUrl: string;
}

export const MEAL_CATEGORIES: readonly { value: MealCategory; label: string }[] = [
  { value: 'MAIN_DISH', label: 'Main dish' },
  { value: 'APPETIZER', label: 'Appetizer' },
  { value: 'DESSERT', label: 'Dessert' },
  { value: 'PASTRY', label: 'Pastry' },
  { value: 'DRINK', label: 'Drink' },
  { value: 'OTHER', label: 'Other' },
];

export const CATEGORY_LABELS = Object.fromEntries(
  MEAL_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<MealCategory, string>;

export const MEAL_PLACEHOLDER_IMAGE = '/meal-placeholder.svg';

export const FORBIDDEN_MEAL_MESSAGE = 'You can only edit your own meals.';
