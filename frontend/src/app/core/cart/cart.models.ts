export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;
export const CART_STORAGE_KEY = 'h2h.cart';

export interface CartItem {
  mealId: string;
  name: string;
  unitPriceMinor: number;
  photoUrl: string | null;
  quantity: number;
}

/** A cart only ever holds meals from one mother's kitchen. */
export interface Cart {
  motherId: string;
  kitchenName: string;
  items: CartItem[];
}

/** The fields of a browsable meal the cart needs. */
export interface CartMeal {
  id: string;
  name: string;
  priceMinor: number;
  photoUrl: string | null;
  motherId: string;
  kitchenName: string;
}

export type AddToCartResult = 'added' | 'conflict';

export function clampQuantity(quantity: number): number {
  const whole = Math.trunc(quantity);
  return Number.isFinite(whole)
    ? Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, whole))
    : MIN_QUANTITY;
}
