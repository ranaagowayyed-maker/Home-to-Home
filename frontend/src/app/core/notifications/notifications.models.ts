export type NotificationType =
  'ORDER_PLACED' | 'STATUS_CHANGED' | 'DELIVERY_REQUEST_OPEN' | 'DELIVERY_ACCEPTED';

export interface AppNotification {
  id: string;
  type: NotificationType;
  message: string;
  orderId: string | null;
  createdAt: string;
  readAt: string | null;
}

export interface NotificationPage {
  items: AppNotification[];
  page: number;
  pageSize: number;
  total: number;
  /** All of the user's unread notifications, not only those on this page. */
  unreadCount: number;
}

/** The bell refreshes on this interval (P1-F003). */
export const NOTIFICATION_POLL_MS = 30_000;

/** How many of the newest notifications the bell lists. */
export const BELL_PAGE_SIZE = 20;
