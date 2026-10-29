import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { AppNotification, BELL_PAGE_SIZE, NotificationPage } from './notifications.models';

@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly http = inject(HttpClient);

  /** Newest first, with the total unread count. */
  list(pageSize = BELL_PAGE_SIZE): Observable<NotificationPage> {
    return this.http.get<NotificationPage>(apiUrl('/notifications'), {
      params: { page: 1, pageSize },
    });
  }

  markRead(id: string): Observable<AppNotification> {
    return this.http.post<AppNotification>(
      apiUrl(`/notifications/${encodeURIComponent(id)}/read`),
      null,
    );
  }
}
