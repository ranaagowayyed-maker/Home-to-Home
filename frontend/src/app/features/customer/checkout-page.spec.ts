import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { User } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { TEST_USER } from '../../core/auth/auth.testing';
import { CART_STORAGE_KEY } from '../../core/cart/cart.models';
import { CartService } from '../../core/cart/cart.service';
import { meal } from '../../core/cart/cart.testing';
import { ToastService } from '../../shared/ui/toast.service';
import { OrderDetail } from '../orders/orders.models';
import { CheckoutPage } from './checkout-page';

const CUSTOMER: User = {
  ...TEST_USER,
  role: 'CUSTOMER',
  kitchenName: null,
  address: '12 Nile Street',
  city: 'Cairo',
};

describe('CheckoutPage', () => {
  let fixture: ComponentFixture<CheckoutPage>;
  let page: CheckoutPage;
  let http: HttpTestingController;
  let cart: CartService;
  let navigate: jasmine.Spy;
  let toast: jasmine.Spy;

  const text = (): string => (fixture.nativeElement as HTMLElement).textContent ?? '';
  const keyOf = (req: { request: { headers: { get(name: string): string | null } } }) =>
    req.request.headers.get('Idempotency-Key');
  const expectPost = () => http.expectOne({ method: 'POST', url: '/api/v1/orders' });

  function create(): void {
    fixture = TestBed.createComponent(CheckoutPage);
    page = fixture.componentInstance;
    fixture.detectChanges();
    http
      .match('/api/v1/config')
      .forEach((req) => req.flush({ deliveryFeeMinor: 1500, currency: 'USD' }));
    fixture.detectChanges();
  }

  beforeEach(() => {
    localStorage.removeItem(CART_STORAGE_KEY);
    TestBed.configureTestingModule({
      imports: [CheckoutPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: signal(CUSTOMER) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    cart = TestBed.inject(CartService);
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    toast = spyOn(TestBed.inject(ToastService), 'success');
    cart.add(meal('m1', { priceMinor: 1250 }), 2);
    cart.add(meal('m2', { name: 'Basbousa', priceMinor: 450 }), 1);
  });

  afterEach(() => {
    http.verify();
    localStorage.removeItem(CART_STORAGE_KEY);
  });

  it('prefills address and phone from the profile and states cash on delivery', () => {
    create();
    expect(page.form.getRawValue()).toEqual({
      deliveryAddress: '12 Nile Street, Cairo',
      customerPhone: CUSTOMER.phone,
      notes: '',
    });
    expect(text()).toContain('Payment: cash on delivery');
    expect(fixture.nativeElement.querySelector('[data-testid="cart-total"]').textContent).toContain(
      '$44.50',
    );
  });

  it('reuses one idempotency key across a double click and a retry', () => {
    create();
    page.placeOrder();
    page.placeOrder(); // double click while in flight
    const first = expectPost();
    const key = keyOf(first);
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
    expect(first.request.body).toEqual({
      items: [
        { mealId: 'm1', quantity: 2 },
        { mealId: 'm2', quantity: 1 },
      ],
      deliveryAddress: '12 Nile Street, Cairo',
      customerPhone: CUSTOMER.phone,
    });

    first.error(new ProgressEvent('error'), { status: 0 });
    fixture.detectChanges();
    expect(text()).toContain("Couldn't place your order. Try again.");
    expect(cart.count()).toBe(3);

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('app-error-banner button')!
      .click();
    const retry = expectPost();
    expect(keyOf(retry)).toBe(key);

    retry.flush({ id: 'o1', number: 1042 } as OrderDetail, { status: 201, statusText: 'Created' });
    expect(cart.isEmpty()).toBeTrue();
    expect(toast).toHaveBeenCalledOnceWith('Order #1042 placed');
    expect(navigate).toHaveBeenCalledOnceWith(['/orders', 'o1']);
  });

  it('uses a fresh key each time checkout is opened', () => {
    create();
    page.placeOrder();
    const first = keyOf(expectPost());
    fixture.destroy();

    create();
    page.placeOrder();
    expect(keyOf(expectPost())).not.toBe(first);
  });

  it('flags unavailable meals on 409 and offers to remove them', () => {
    create();
    page.placeOrder();
    const first = expectPost();
    const key = keyOf(first);
    first.flush(
      { status: 409, code: 'meal_unavailable', unavailableMealIds: ['m2'] },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    const flagged = fixture.nativeElement.querySelector('[data-testid="unavailable-items"]');
    expect(flagged.textContent).toContain('Basbousa');
    expect(cart.hasUnavailable()).toBeTrue();
    page.placeOrder();
    http.expectNone('/api/v1/orders');

    const remove = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    ).find((b) => b.textContent?.includes('Remove them from my cart'))!;
    remove.click();
    fixture.detectChanges();
    expect(cart.items().map((i) => i.mealId)).toEqual(['m1']);

    page.placeOrder();
    const next = expectPost();
    expect(next.request.body.items).toEqual([{ mealId: 'm1', quantity: 2 }]);
    // The rejected attempt created nothing and the cart changed, so this is a new order.
    expect(keyOf(next)).not.toBe(key);
  });

  it('validates the address and phone before sending', () => {
    create();
    page.form.patchValue({ deliveryAddress: 'abc', customerPhone: 'nope' });
    page.placeOrder();
    fixture.detectChanges();

    expect(text()).toContain('Use at least 5 characters.');
    expect(text()).toContain('Enter a valid phone number');
    http.expectNone('/api/v1/orders');
  });
});
