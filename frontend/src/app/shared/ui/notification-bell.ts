import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, model, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NotificationsApi } from '../../core/notifications/notifications-api';
import {
  AppNotification,
  NOTIFICATION_POLL_MS,
} from '../../core/notifications/notifications.models';
import { pollStream, toPollState } from '../lib/poll';
import { Spinner } from './spinner';

/** Header bell: unread badge refreshed every 30 seconds and a dropdown of recent notifications. */
@Component({
  selector: 'app-notification-bell',
  imports: [DatePipe, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative' },
  template: `
    <button
      type="button"
      class="relative inline-flex size-11 items-center justify-center rounded-lg text-stone-700 hover:bg-stone-100"
      aria-haspopup="true"
      [attr.aria-expanded]="open()"
      [attr.aria-label]="label()"
      (click)="toggle($event)"
    >
      <svg
        class="size-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
        />
      </svg>
      @if (unread() > 0) {
        <span
          class="absolute top-0.5 right-0.5 flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-xs font-bold text-white"
          data-testid="unread-badge"
        >
          {{ unread() > 99 ? '99+' : unread() }}
        </span>
      }
    </button>
    @if (open()) {
      <div
        class="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-stone-200 bg-white shadow-lg"
        role="dialog"
        aria-label="Notifications"
        tabindex="-1"
        (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()"
      >
        <p class="border-b border-stone-200 px-4 py-3 text-sm font-semibold">Notifications</p>
        @let s = state();
        @if (s.value; as page) {
          @if (page.items.length === 0) {
            <p class="px-4 py-6 text-center text-sm text-stone-600">You're all caught up.</p>
          } @else {
            <ul class="max-h-96 overflow-y-auto py-1">
              @for (item of page.items; track item.id) {
                <li>
                  <button
                    type="button"
                    class="flex min-h-11 w-full flex-col items-start gap-0.5 px-4 py-2 text-left hover:bg-stone-100"
                    [class.bg-brand-50]="isUnread(item)"
                    [attr.data-testid]="'notification-' + item.id"
                    (click)="select(item)"
                  >
                    <span class="flex w-full items-center gap-2 text-sm">
                      @if (isUnread(item)) {
                        <span
                          class="size-2 shrink-0 rounded-full bg-brand-700"
                          aria-hidden="true"
                        ></span>
                        <span class="sr-only">Unread:</span>
                      }
                      <span [class.font-semibold]="isUnread(item)">{{ item.message }}</span>
                    </span>
                    <span class="text-xs text-stone-500">{{
                      item.createdAt | date: 'MMM d, h:mm a'
                    }}</span>
                  </button>
                </li>
              }
            </ul>
          }
        } @else if (s.loading) {
          <p class="flex justify-center px-4 py-6" aria-label="Loading notifications">
            <app-spinner />
          </p>
        } @else {
          <p
            class="flex items-center justify-between gap-3 px-4 py-4 text-sm text-red-700"
            role="alert"
          >
            Couldn't load notifications.
            <button
              type="button"
              class="inline-flex min-h-11 items-center font-semibold underline"
              (click)="reload$.next()"
            >
              Retry
            </button>
          </p>
        }
      </div>
    }
  `,
})
export class NotificationBell {
  private readonly api = inject(NotificationsApi);
  private readonly router = inject(Router);

  /** Bound by the header so that opening one menu closes the other. */
  readonly open = model(false);

  protected readonly reload$ = new Subject<void>();
  /** Marked read here but not yet reflected by a poll. */
  private readonly readLocally = signal<ReadonlySet<string>>(new Set());

  // A failed poll is silent: the last good list stays and the error shows only in the open menu.
  protected readonly state = toPollState(
    pollStream(() => this.api.list(), { reload$: this.reload$, intervalMs: NOTIFICATION_POLL_MS }),
  );

  protected readonly unread = computed(() => {
    const page = this.state().value;
    if (!page) {
      return 0;
    }
    const local = page.items.filter((n) => n.readAt === null && this.readLocally().has(n.id));
    return Math.max(0, page.unreadCount - local.length);
  });

  protected readonly label = computed(() => {
    const count = this.unread();
    return count === 0 ? 'Notifications' : `Notifications, ${count} unread`;
  });

  protected isUnread(item: AppNotification): boolean {
    return item.readAt === null && !this.readLocally().has(item.id);
  }

  protected toggle(event: MouseEvent): void {
    event.stopPropagation();
    const opening = !this.open();
    this.open.set(opening);
    if (opening) {
      this.reload$.next();
    }
  }

  protected select(item: AppNotification): void {
    this.open.set(false);
    if (this.isUnread(item)) {
      this.readLocally.update((ids) => new Set(ids).add(item.id));
      // Fire and forget: the next poll corrects the badge if this fails.
      this.api.markRead(item.id).subscribe({ error: () => this.forget(item.id) });
    }
    if (item.orderId) {
      void this.router.navigate(['/orders', item.orderId]);
    }
  }

  private forget(id: string): void {
    this.readLocally.update((ids) => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }
}
