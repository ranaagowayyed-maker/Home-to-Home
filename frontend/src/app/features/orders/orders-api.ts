import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../../core/api/api-url';
import { Paged } from '../../core/api/paged';
import {
  OrderDetail,
  OrderListQuery,
  ORDERS_PAGE_SIZE,
  OrderStatus,
  OrderSummary,
  PlaceOrderRequest,
} from './orders.models';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly http = inject(HttpClient);

  /** Re-sending the same key returns the original order instead of creating another. */
  place(body: PlaceOrderRequest, idempotencyKey: string): Observable<OrderDetail> {
    return this.http.post<OrderDetail>(apiUrl('/orders'), body, {
      headers: { 'Idempotency-Key': idempotencyKey },
    });
  }

  list(query: OrderListQuery = {}): Observable<Paged<OrderSummary>> {
    const params: Record<string, string | number> = {
      page: query.page ?? 1,
      pageSize: query.pageSize ?? ORDERS_PAGE_SIZE,
    };
    if (query.status?.length) {
      params['status'] = query.status.join(',');
    }
    return this.http.get<Paged<OrderSummary>>(apiUrl('/orders'), { params });
  }

  get(id: string): Observable<OrderDetail> {
    return this.http.get<OrderDetail>(apiUrl(`/orders/${encodeURIComponent(id)}`));
  }

  updateStatus(id: string, status: OrderStatus): Observable<OrderDetail> {
    return this.http.patch<OrderDetail>(apiUrl(`/orders/${encodeURIComponent(id)}/status`), {
      status,
    });
  }
}
