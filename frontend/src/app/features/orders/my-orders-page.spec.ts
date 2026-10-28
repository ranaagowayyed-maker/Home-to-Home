import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { User } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { TEST_USER } from '../../core/auth/auth.testing';
import { MyOrdersPage } from './my-orders-page';
import { OrderSummary } from './orders.models';

const summary = (id: string, overrides: Partial<OrderSummary> = {}): OrderSummary => ({
  id,
  number: 1042,
  status: 'DELIVERED',
  createdAt: '2026-10-28T10:00:00Z',
  kitchenName: "Fatima's Kitchen",
  customerName: 'Sara',
  itemCount: 2,
  totalMinor: 4000,
  ...overrides,
});

describe('MyOrdersPage', () => {
  let fixture: ComponentFixture<MyOrdersPage>;
  let http: HttpTestingController;

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const orders = () => http.expectOne((req) => req.url === '/api/v1/orders');

  function create(user: User): void {
    TestBed.configureTestingModule({
      imports: [MyOrdersPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: signal(user) } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MyOrdersPage);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  it('lists a mother’s received orders with the customer name', () => {
    create(TEST_USER);
    const req = orders();
    expect(req.request.params.get('pageSize')).toBe('20');
    expect(req.request.params.has('status')).toBeFalse();
    req.flush({ items: [summary('o1')], page: 1, pageSize: 20, total: 1 });
    fixture.detectChanges();

    expect(el().querySelector('h1')?.textContent).toContain('Order History');
    expect(el().textContent).toContain('Sara');
    expect(el().querySelector('[data-testid="order-count"]')?.textContent).toContain('1 order');
  });

  it('filters by status and offers to show all when nothing matches', () => {
    create({ ...TEST_USER, role: 'CUSTOMER', kitchenName: null });
    orders().flush({ items: [summary('o1')], page: 1, pageSize: 20, total: 1 });
    fixture.detectChanges();

    const select = el().querySelector<HTMLSelectElement>('[data-testid="status-filter"]')!;
    select.value = 'CANCELLED';
    select.dispatchEvent(new Event('change'));
    const filtered = orders();
    expect(filtered.request.params.get('status')).toBe('CANCELLED');
    filtered.flush({ items: [], page: 1, pageSize: 20, total: 0 });
    fixture.detectChanges();
    expect(el().textContent).toContain('No orders with this status.');

    Array.from(el().querySelectorAll('button'))
      .find((b) => b.textContent?.includes('Show all orders'))!
      .click();
    const all = orders();
    expect(all.request.params.has('status')).toBeFalse();
    all.flush({ items: [summary('o1')], page: 1, pageSize: 20, total: 1 });
  });
});
