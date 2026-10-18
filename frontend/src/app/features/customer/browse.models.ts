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
