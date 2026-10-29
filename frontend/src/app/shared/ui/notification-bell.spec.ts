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
import {
  AppNotification,
  NOTIFICATION_POLL_MS,
  NotificationPage,
} from '../../core/notifications/notifications.models';
import { NotificationBell } from './notification-bell';

const notification = (id: string, overrides: Partial<AppNotification> = {}): AppNotification => ({
  id,
  type: 'ORDER_PLACED',
  message: 'New order #1042',
  orderId: 'o1',
  createdAt: '2026-10-28T10:00:00Z',
  readAt: null,
  ...overrides,
});

const page = (items: AppNotification[], unreadCount: number): NotificationPage => ({
  items,
  page: 1,
  pageSize: 20,
  total: items.length,
  unreadCount,
});

describe('NotificationBell', () => {
  let fixture: ComponentFixture<NotificationBell>;
  let http: HttpTestingController;
  let navigate: jasmine.Spy;

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const badge = () => el().querySelector('[data-testid="unread-badge"]');
  const list = () => http.expectOne((req) => req.url === '/api/v1/notifications');
  const bell = () => el().querySelector<HTMLButtonElement>('button')!;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NotificationBell],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
  });

  function close(): void {
    fixture.destroy();
    discardPeriodicTasks();
  }

  /** Created inside each fakeAsync test so the polling timer runs on the fake clock. */
  function create(): void {
    fixture = TestBed.createComponent(NotificationBell);
    fixture.detectChanges();
    tick();
  }

  afterEach(() => http.verify());

  it('shows the unread count and refreshes it every 30 seconds', fakeAsync(() => {
    create();
    list().flush(page([notification('n1')], 1));
    fixture.detectChanges();
    expect(badge()?.textContent?.trim()).toBe('1');

    tick(NOTIFICATION_POLL_MS - 1);
    http.expectNone('/api/v1/notifications');
    tick(1);
    list().flush(page([notification('n2'), notification('n1')], 2));
    fixture.detectChanges();
    expect(badge()?.textContent?.trim()).toBe('2');
    expect(bell().getAttribute('aria-label')).toBe('Notifications, 2 unread');
    close();
  }));

  it('opens the order and marks the notification read', fakeAsync(() => {
    create();
    list().flush(page([notification('n1')], 1));
    fixture.detectChanges();

    bell().click();
    tick();
    list().flush(page([notification('n1')], 1));
    fixture.detectChanges();
    el().querySelector<HTMLButtonElement>('[data-testid="notification-n1"]')!.click();
    fixture.detectChanges();

    const read = http.expectOne({ method: 'POST', url: '/api/v1/notifications/n1/read' });
    read.flush(notification('n1', { readAt: '2026-10-28T10:05:00Z' }));
    expect(navigate).toHaveBeenCalledWith(['/orders', 'o1']);
    expect(badge()).toBeNull();
    close();
  }));

  it('says when there is nothing new', fakeAsync(() => {
    create();
    list().flush(page([], 0));
    bell().click();
    tick();
    list().flush(page([], 0));
    fixture.detectChanges();

    expect(el().textContent).toContain("You're all caught up.");
    expect(badge()).toBeNull();
    close();
  }));

  it('stays quiet when a poll fails and shows the error only in the open list', fakeAsync(() => {
    create();
    list().flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(el().querySelector('[role="alert"]')).toBeNull();

    bell().click();
    tick();
    list().flush(null, { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(el().querySelector('[role="alert"]')?.textContent).toContain(
      "Couldn't load notifications.",
    );
    close();
  }));
});
