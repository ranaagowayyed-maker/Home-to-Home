import { MealCategory } from '../meals/meals.models';

export interface BrowseMeal {
  id: string;
  name: string;
  description: string;
  category: MealCategory;
  priceMinor: number;
  photoUrl: string | null;
  motherId: string;
  kitchenName: string;
}

export const BROWSE_PAGE_SIZE = 20;

export const NEW_CART_TITLE = 'Start a new cart?';
export const NEW_CART_MESSAGE = 'Your current cart has meals from another kitchen.';
