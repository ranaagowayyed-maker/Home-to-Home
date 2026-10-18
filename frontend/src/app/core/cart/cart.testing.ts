import { CartMeal } from './cart.models';

export const meal = (id: string, overrides: Partial<CartMeal> = {}): CartMeal => ({
  id,
  name: `Meal ${id}`,
  priceMinor: 1250,
  photoUrl: null,
  motherId: 'mother-a',
  kitchenName: "Fatima's Kitchen",
  ...overrides,
});
