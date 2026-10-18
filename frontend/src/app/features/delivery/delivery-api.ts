import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/api/api-url';
import { Paged } from '../../core/api/paged';
import { OrderDetail, ORDERS_PAGE_SIZE, OrderSummary } from '../orders/orders.models';
import { DeliveryRequestList } from './delivery.models';

@Injectable({ providedIn: 'root' })
export class DeliveryApi {
  private readonly http = inject(HttpClient);

  /** Open requests, oldest first, plus this user's active-delivery count. */
  available(): Observable<DeliveryRequestList> {
    return this.http.get<DeliveryRequestList>(apiUrl('/delivery-requests'));
  }

  accept(id: string): Observable<OrderDetail> {
    return this.http.post<OrderDetail>(
      apiUrl(`/delivery-requests/${encodeURIComponent(id)}/accept`),
      null,
    );
  }

  mine(page = 1): Observable<Paged<OrderSummary>> {
    return this.http.get<Paged<OrderSummary>>(apiUrl('/delivery-requests/mine'), {
      params: { page, pageSize: ORDERS_PAGE_SIZE },
    });
  }
}
