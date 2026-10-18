import { TestBed } from '@angular/core/testing';
import { CART_STORAGE_KEY } from './cart.models';
import { CartService } from './cart.service';
import { meal } from './cart.testing';

describe('CartService', () => {
  let cart: CartService;

  beforeEach(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    cart = TestBed.inject(CartService);
  });

  afterEach(() => localStorage.removeItem(CART_STORAGE_KEY));

  it('adds meals from one kitchen and merges quantities up to 10', () => {
    expect(cart.add(meal('m1'), 2)).toBe('added');
    expect(cart.add(meal('m2', { priceMinor: 500 }), 1)).toBe('added');
    expect(cart.add(meal('m1'), 3)).toBe('added');

    expect(cart.items().map((i) => [i.mealId, i.quantity])).toEqual([
      ['m1', 5],
      ['m2', 1],
    ]);
    expect(cart.count()).toBe(6);

    cart.add(meal('m1'), 9);
    expect(cart.items()[0].quantity).toBe(10);
  });

  it('refuses a meal from another kitchen until the cart is replaced', () => {
    cart.add(meal('m1'), 2);
    const other = meal('b1', { motherId: 'mother-b', kitchenName: "Huda's Kitchen" });

    expect(cart.conflictsWith('mother-b')).toBeTrue();
    expect(cart.conflictsWith('mother-a')).toBeFalse();
    expect(cart.add(other, 1)).toBe('conflict');
    expect(cart.items().map((i) => i.mealId)).toEqual(['m1']);

    cart.replaceWith(other, 3);
    expect(cart.motherId()).toBe('mother-b');
    expect(cart.kitchenName()).toBe("Huda's Kitchen");
    expect(cart.items().map((i) => [i.mealId, i.quantity])).toEqual([['b1', 3]]);
  });

  it('computes subtotal and total with the delivery fee in minor units', () => {
    cart.add(meal('m1', { priceMinor: 1250 }), 2);
    cart.add(meal('m2', { priceMinor: 399 }), 3);

    expect(cart.subtotalMinor()).toBe(2 * 1250 + 3 * 399);
    expect(cart.totalMinor(1500)).toBe(2 * 1250 + 3 * 399 + 1500);
  });

  it('clamps quantity edits to 1-10 and empties the cart when the last item goes', () => {
    cart.add(meal('m1'), 2);
    cart.setQuantity('m1', 0);
    expect(cart.items()[0].quantity).toBe(1);
    cart.setQuantity('m1', 42);
    expect(cart.items()[0].quantity).toBe(10);

    cart.remove('m1');
    expect(cart.isEmpty()).toBeTrue();
    expect(cart.motherId()).toBeNull();
    // An empty cart no longer pins a kitchen.
    expect(cart.conflictsWith('mother-b')).toBeFalse();
  });

  it('persists to localStorage and restores in a new session', () => {
    cart.add(meal('m1'), 2);
    expect(JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? 'null').items.length).toBe(1);

    TestBed.resetTestingModule();
    const restored = TestBed.inject(CartService);
    expect(restored.items().map((i) => [i.mealId, i.quantity])).toEqual([['m1', 2]]);
    expect(restored.kitchenName()).toBe("Fatima's Kitchen");

    restored.clear();
    expect(localStorage.getItem(CART_STORAGE_KEY)).toBeNull();
  });

  it('ignores corrupt storage and keeps working when storage throws', () => {
    localStorage.setItem(CART_STORAGE_KEY, '{not json');
    TestBed.resetTestingModule();
    expect(TestBed.inject(CartService).isEmpty()).toBeTrue();

    spyOn(Storage.prototype, 'setItem').and.throwError('QuotaExceededError');
    const inMemory = TestBed.inject(CartService);
    expect(() => inMemory.add(meal('m1'), 1)).not.toThrow();
    expect(inMemory.count()).toBe(1);
  });

  it('flags unavailable meals and removes only those', () => {
    cart.add(meal('m1'), 1);
    cart.add(meal('m2'), 1);
    cart.markUnavailable(['m2']);
    expect(cart.hasUnavailable()).toBeTrue();

    cart.removeUnavailable();
    expect(cart.items().map((i) => i.mealId)).toEqual(['m1']);
    expect(cart.hasUnavailable()).toBeFalse();
  });
});
