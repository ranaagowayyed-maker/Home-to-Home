import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ComponentFixture,
  discardPeriodicTasks,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { POLL_INTERVAL_MS } from '../../shared/lib/poll';
import { ToastService } from '../../shared/ui/toast.service';
import { orderDetail } from '../orders/orders.testing';
import { AvailableDeliveriesPage } from './available-deliveries-page';
import { DeliveryRequestList, DeliveryRequestSummary } from './delivery.models';

const LIST_URL = '/api/v1/delivery-requests';
const ACCEPT_URL = '/api/v1/delivery-requests/r1/accept';

const request: DeliveryRequestSummary = {
  id: 'r1',
  orderId: 'o1',
  orderNumber: 1042,
  kitchenName: "Fatima's Kitchen",
  kitchenCity: 'Giza',
  customerCity: 'Cairo',
  itemCount: 3,
  deliveryFeeMinor: 1500,
  openedAt: '2026-10-18T10:00:00Z',
};

const list = (overrides: Partial<DeliveryRequestList> = {}): DeliveryRequestList => ({
  items: [request],
  activeDeliveries: 0,
  maxActiveDeliveries: 3,
  ...overrides,
});

describe('AvailableDeliveriesPage', () => {
  let fixture: ComponentFixture<AvailableDeliveriesPage>;
  let http: HttpTestingController;
  let toast: jasmine.Spy;
  let navigate: jasmine.Spy;

  const el = (): HTMLElement => fixture.nativeElement;
  const acceptButton = (): HTMLButtonElement | undefined =>
    Array.from(el().querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === 'Accept Delivery',
    );

  function open(): void {
    fixture = TestBed.createComponent(AvailableDeliveriesPage);
    fixture.detectChanges();
    tick(0);
  }

  function respond(body: DeliveryRequestList): void {
    http.expectOne({ method: 'GET', url: LIST_URL }).flush(body);
    fixture.detectChanges();
  }

  function close(): void {
    fixture.destroy();
    discardPeriodicTasks();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AvailableDeliveriesPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    toast = spyOn(TestBed.inject(ToastService), 'success');
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  afterEach(() => http.verify());

  it('lists open requests with kitchen, areas, item count and fee', fakeAsync(() => {
    open();
    respond(list());

    const text = el().textContent ?? '';
    expect(text).toContain("Fatima's Kitchen");
    expect(text).toContain('Giza');
    expect(text).toContain('Cairo');
    expect(text).toContain('3 items');
    expect(text).toContain('$15.00');
    close();
  }));

  it('shows the empty state and refreshes every 15 seconds', fakeAsync(() => {
    open();
    respond(list({ items: [] }));
    expect(el().textContent).toContain('No deliveries right now. Check back soon.');

    tick(POLL_INTERVAL_MS);
    respond(list());
    expect(acceptButton()).toBeDefined();
    close();
  }));

  it('disables Accept at the active-delivery limit', fakeAsync(() => {
    open();
    respond(list({ activeDeliveries: 3, maxActiveDeliveries: 3 }));

    expect(acceptButton()?.disabled).toBeTrue();
    expect(el().textContent).toContain('Finish an active delivery first.');
    acceptButton()?.click();
    http.expectNone(ACCEPT_URL);
    close();
  }));

  it('accepts, toasts and opens the order page', fakeAsync(() => {
    open();
    respond(list());

    acceptButton()!.click();
    fixture.detectChanges();
    expect(acceptButton()!.disabled).toBeTrue();
    http.expectOne({ method: 'POST', url: ACCEPT_URL }).flush(orderDetail());

    expect(toast).toHaveBeenCalledOnceWith('Delivery accepted');
    expect(navigate).toHaveBeenCalledOnceWith(['/orders', 'o1']);
    close();
  }));

  it('explains a 409 delivery_taken and refreshes the list', fakeAsync(() => {
    open();
    respond(list());

    acceptButton()!.click();
    http
      .expectOne(ACCEPT_URL)
      .flush({ status: 409, code: 'delivery_taken' }, { status: 409, statusText: 'Conflict' });
    tick(0);
    respond(list({ items: [] }));

    expect(el().textContent).toContain('This delivery was just taken.');
    expect(el().textContent).toContain('No deliveries right now.');
    expect(navigate).not.toHaveBeenCalled();
    close();
  }));

  it('explains a 409 request_closed and refreshes the list', fakeAsync(() => {
    open();
    respond(list());

    acceptButton()!.click();
    http
      .expectOne(ACCEPT_URL)
      .flush({ status: 409, code: 'request_closed' }, { status: 409, statusText: 'Conflict' });
    tick(0);
    respond(list({ items: [] }));

    expect(el().textContent).toContain('This request is no longer available.');
    close();
  }));
});
