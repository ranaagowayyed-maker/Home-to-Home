import { computed, Injectable, signal } from '@angular/core';
import {
  AddToCartResult,
  Cart,
  CART_STORAGE_KEY,
  CartItem,
  CartMeal,
  clampQuantity,
} from './cart.models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly state = signal<Cart | null>(readStoredCart());
  private readonly flagged = signal<ReadonlySet<string>>(new Set());

  readonly cart = this.state.asReadonly();
  readonly items = computed<readonly CartItem[]>(() => this.state()?.items ?? []);
  readonly motherId = computed(() => this.state()?.motherId ?? null);
  readonly kitchenName = computed(() => this.state()?.kitchenName ?? null);
  readonly isEmpty = computed(() => this.items().length === 0);
  /** Total number of portions, shown on the header badge. */
  readonly count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly subtotalMinor = computed(() =>
    this.items().reduce((sum, item) => sum + item.unitPriceMinor * item.quantity, 0),
  );
  /** Meals the server reported as unavailable at checkout (not persisted). */
  readonly unavailableIds = this.flagged.asReadonly();
  readonly hasUnavailable = computed(() =>
    this.items().some((item) => this.flagged().has(item.mealId)),
  );

  totalMinor(deliveryFeeMinor: number): number {
    return this.subtotalMinor() + deliveryFeeMinor;
  }

  /** True when adding this mother's meal would require starting a new cart. */
  conflictsWith(motherId: string): boolean {
    const current = this.motherId();
    return current !== null && current !== motherId;
  }

  /** Adds to the cart, merging quantities; refuses a meal from another kitchen. */
  add(meal: CartMeal, quantity: number): AddToCartResult {
    const cart = this.state();
    if (!cart) {
      this.replaceWith(meal, quantity);
      return 'added';
    }
    if (cart.motherId !== meal.motherId) {
      return 'conflict';
    }
    const existing = cart.items.find((item) => item.mealId === meal.id);
    const items = existing
      ? cart.items.map((item) =>
          item === existing ? { ...item, quantity: clampQuantity(item.quantity + quantity) } : item,
        )
      : [...cart.items, toItem(meal, quantity)];
    this.commit({ ...cart, kitchenName: meal.kitchenName, items });
    return 'added';
  }

  /** Discards the current cart and starts a new one with this meal. */
  replaceWith(meal: CartMeal, quantity: number): void {
    this.flagged.set(new Set());
    this.commit({
      motherId: meal.motherId,
      kitchenName: meal.kitchenName,
      items: [toItem(meal, quantity)],
    });
  }

  setQuantity(mealId: string, quantity: number): void {
    const cart = this.state();
    if (!cart) {
      return;
    }
    this.commit({
      ...cart,
      items: cart.items.map((item) =>
        item.mealId === mealId ? { ...item, quantity: clampQuantity(quantity) } : item,
      ),
    });
  }

  remove(mealId: string): void {
    const cart = this.state();
    if (!cart) {
      return;
    }
    this.commit({ ...cart, items: cart.items.filter((item) => item.mealId !== mealId) });
  }

  markUnavailable(mealIds: readonly string[]): void {
    this.flagged.set(new Set(mealIds));
  }

  removeUnavailable(): void {
    const flagged = this.flagged();
    const cart = this.state();
    if (cart) {
      this.commit({ ...cart, items: cart.items.filter((item) => !flagged.has(item.mealId)) });
    }
    this.flagged.set(new Set());
  }

  clear(): void {
    this.flagged.set(new Set());
    this.commit(null);
  }

  private commit(cart: Cart | null): void {
    const next = cart && cart.items.length > 0 ? cart : null;
    this.state.set(next);
    writeStoredCart(next);
  }
}

function toItem(meal: CartMeal, quantity: number): CartItem {
  return {
    mealId: meal.id,
    name: meal.name,
    unitPriceMinor: meal.priceMinor,
    photoUrl: meal.photoUrl,
    quantity: clampQuantity(quantity),
  };
}

function readStoredCart(): Cart | null {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (!isCart(parsed)) {
      return null;
    }
    const items = parsed.items.map((item) => ({
      ...item,
      photoUrl: item.photoUrl ?? null,
      quantity: clampQuantity(item.quantity),
    }));
    return { ...parsed, items };
  } catch {
    return null;
  }
}

function writeStoredCart(cart: Cart | null): void {
  try {
    if (cart) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
  } catch {
    // Storage may be full or blocked (private mode); the cart still works in memory.
  }
}

function isCart(value: unknown): value is Cart {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const cart = value as Partial<Cart>;
  return (
    typeof cart.motherId === 'string' &&
    typeof cart.kitchenName === 'string' &&
    Array.isArray(cart.items) &&
    cart.items.length > 0 &&
    cart.items.every(
      (item: Partial<CartItem>) =>
        typeof item.mealId === 'string' &&
        typeof item.name === 'string' &&
        Number.isInteger(item.unitPriceMinor) &&
        Number.isInteger(item.quantity),
    )
  );
}
