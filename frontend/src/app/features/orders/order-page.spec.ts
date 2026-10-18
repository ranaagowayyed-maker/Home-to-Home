import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Role, User } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { TEST_USER } from '../../core/auth/auth.testing';
import { POLL_INTERVAL_MS } from '../../shared/lib/poll';
import { ToastService } from '../../shared/ui/toast.service';
import { OrderPage } from './order-page';
import { OrderDetail } from './orders.models';
import { orderDetail } from './orders.testing';

const ORDER_URL = '/api/v1/orders/o1';

describe('OrderPage', () => {
  let fixture: ComponentFixture<OrderPage>;
  let http: HttpTestingController;
  let toast: jasmine.Spy;
  const user = signal<User>(TEST_USER);

  const el = (): HTMLElement => fixture.nativeElement;
  const actionLabels = (): string[] =>
    Array.from(el().querySelectorAll('[data-testid="order-actions"] button')).map(
      (b) => b.textContent?.trim() ?? '',
    );
  const button = (label: string): HTMLButtonElement =>
    Array.from(el().querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === label,
    )!;

  function open(role: Role = 'MOTHER'): void {
    user.set({ ...TEST_USER, role });
    fixture = TestBed.createComponent(OrderPage);
    fixture.componentRef.setInput('id', 'o1');
    fixture.detectChanges();
    tick(0);
  }

  function respond(order: OrderDetail): void {
    http.expectOne({ method: 'GET', url: ORDER_URL }).flush(order);
    fixture.detectChanges();
  }

  function close(): void {
    fixture.destroy();
    discardPeriodicTasks();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrderPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: { currentUser: user } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    toast = spyOn(TestBed.inject(ToastService), 'success');
  });

  afterEach(() => http.verify());

  it('renders action buttons only from allowedActions', fakeAsync(() => {
    open('MOTHER');
    respond(orderDetail({ allowedActions: ['PREPARING', 'REJECTED'] }));

    expect(actionLabels()).toEqual(['Accept & start preparing', 'Reject order']);
    expect(el().querySelector('app-status-badge')?.textContent).toContain('Placed');
    expect(el().textContent).toContain('Stuffed Grape Leaves');
    expect(el().textContent).toContain('$40.00');
    close();
  }));

  it('renders no actions when the server allows none', fakeAsync(() => {
    open('CUSTOMER');
    respond(orderDetail({ status: 'PREPARING', allowedActions: [] }));

    expect(el().querySelector('[data-testid="order-actions"]')).toBeNull();
    expect(actionLabels()).toEqual([]);
    close();
  }));

  it('shows the pickup contact only to delivery people', fakeAsync(() => {
    open('DELIVERY');
    respond(
      orderDetail({
        status: 'READY_FOR_PICKUP',
        deliveryPerson: { name: 'Omar', phone: '+20 111 222 3333' },
        allowedActions: ['OUT_FOR_DELIVERY'],
      }),
    );

    expect(actionLabels()).toEqual(['Picked up']);
    expect(el().querySelector('[data-testid="pickup"]')?.textContent).toContain('5 Tahrir Square');
    expect(el().textContent).toContain('Omar');
    close();
  }));

  it('polls every 15 seconds and stops once the order is terminal', fakeAsync(() => {
    open('CUSTOMER');
    respond(orderDetail({ status: 'OUT_FOR_DELIVERY' }));

    tick(POLL_INTERVAL_MS - 1);
    http.expectNone(ORDER_URL);
    tick(1);
    respond(orderDetail({ status: 'DELIVERED' }));
    expect(el().querySelector('app-status-badge')?.textContent).toContain('Delivered');

    tick(POLL_INTERVAL_MS * 4);
    http.expectNone(ORDER_URL);
    close();
  }));

  it('stops polling when the page is destroyed', fakeAsync(() => {
    open('CUSTOMER');
    respond(orderDetail());
    fixture.destroy();

    tick(POLL_INTERVAL_MS * 2);
    expect(http.match(ORDER_URL)).toEqual([]);
  }));

  it('applies an action, toasts and keeps polling from the new state', fakeAsync(() => {
    open('MOTHER');
    respond(orderDetail({ allowedActions: ['PREPARING', 'REJECTED'] }));

    button('Accept & start preparing').click();
    fixture.detectChanges();
    const patch = http.expectOne({ method: 'PATCH', url: `${ORDER_URL}/status` });
    expect(patch.request.body).toEqual({ status: 'PREPARING' });
    expect(button('Accept & start preparing').disabled).toBeTrue();

    patch.flush(orderDetail({ status: 'PREPARING', allowedActions: ['READY_FOR_PICKUP'] }));
    fixture.detectChanges();
    expect(toast).toHaveBeenCalledWith('Order #1042 is being prepared');
    expect(actionLabels()).toEqual(['Mark ready']);

    tick(POLL_INTERVAL_MS);
    respond(orderDetail({ status: 'PREPARING', allowedActions: ['READY_FOR_PICKUP'] }));
    close();
  }));

  it('asks for confirmation before rejecting', fakeAsync(() => {
    open('MOTHER');
    respond(orderDetail({ allowedActions: ['PREPARING', 'REJECTED'] }));

    button('Reject order').click();
    fixture.detectChanges();
    http.expectNone(`${ORDER_URL}/status`);
    expect(el().querySelector('dialog')?.textContent).toContain('Reject this order?');

    const confirm = el().querySelectorAll<HTMLButtonElement>('dialog button')[1];
    confirm.click();
    http
      .expectOne(`${ORDER_URL}/status`)
      .flush(orderDetail({ status: 'REJECTED', allowedActions: [] }));
    fixture.detectChanges();
    expect(toast).toHaveBeenCalledWith('Order #1042 rejected');

    // Terminal: no more polling.
    tick(POLL_INTERVAL_MS * 2);
    http.expectNone(ORDER_URL);
    close();
  }));

  it('refetches and explains on a 409 conflict', fakeAsync(() => {
    open('CUSTOMER');
    respond(orderDetail({ allowedActions: ['CANCELLED'] }));

    button('Cancel order').click();
    fixture.detectChanges();
    el().querySelectorAll<HTMLButtonElement>('dialog button')[1].click();
    http
      .expectOne(`${ORDER_URL}/status`)
      .flush({ status: 409, code: 'invalid_transition' }, { status: 409, statusText: 'Conflict' });
    tick(0);
    respond(orderDetail({ status: 'PREPARING', allowedActions: [] }));

    expect(el().textContent).toContain('The kitchen already started preparing this order.');
    expect(actionLabels()).toEqual([]);
    close();
  }));

  it('shows a no-access message on 403 and stops polling', fakeAsync(() => {
    open('CUSTOMER');
    http
      .expectOne(ORDER_URL)
      .flush({ status: 403, code: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();

    expect(el().textContent).toContain("You don't have access to that.");
    tick(POLL_INTERVAL_MS * 2);
    http.expectNone(ORDER_URL);
    close();
  }));
});
