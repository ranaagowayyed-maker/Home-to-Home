import { OrderStatus } from '../../shared/lib/order-status';

export type { OrderStatus } from '../../shared/lib/order-status';

export interface OrderItem {
  mealId: string;
  name: string;
  unitPriceMinor: number;
  quantity: number;
  lineTotalMinor: number;
}

export interface TimelineEntry {
  status: OrderStatus;
  at: string;
}

export interface Person {
  name: string;
  phone: string;
}

export interface OrderDetail {
  id: string;
  number: number;
  status: OrderStatus;
  createdAt: string;
  kitchenName: string;
  motherId: string;
  items: OrderItem[];
  subtotalMinor: number;
  deliveryFeeMinor: number;
  totalMinor: number;
  paymentMethod: 'CASH_ON_DELIVERY';
  deliveryAddress: string;
  customerPhone: string;
  notes: string | null;
  customerName: string;
  /** Pickup contact. */
  mother: Person & { address: string | null };
  /** Set once a delivery person accepted the order. */
  deliveryPerson: Person | null;
  /** Oldest first. */
  timeline: TimelineEntry[];
  /** Target statuses the current user may move the order to right now. */
  allowedActions: OrderStatus[];
}

export interface OrderSummary {
  id: string;
  number: number;
  status: OrderStatus;
  createdAt: string;
  kitchenName: string;
  customerName: string;
  itemCount: number;
  totalMinor: number;
}

export interface PlaceOrderRequest {
  items: { mealId: string; quantity: number }[];
  deliveryAddress: string;
  customerPhone: string;
  notes?: string;
}

export interface OrderListQuery {
  status?: readonly OrderStatus[];
  page?: number;
  pageSize?: number;
}

/** Button label for moving an order to a status; only ever shown for `allowedActions`. */
export const ACTION_LABELS: Partial<Record<OrderStatus, string>> = {
  PREPARING: 'Accept & start preparing',
  REJECTED: 'Reject order',
  READY_FOR_PICKUP: 'Mark ready',
  CANCELLED: 'Cancel order',
  OUT_FOR_DELIVERY: 'Picked up',
  DELIVERED: 'Delivered',
};

/** Actions that need a confirmation dialog first. */
export const DESTRUCTIVE_ACTIONS: readonly OrderStatus[] = ['REJECTED', 'CANCELLED'];

/** Toast after a successful status change: "Order #1042 {text}". */
export const ACTION_TOASTS: Partial<Record<OrderStatus, string>> = {
  PREPARING: 'is being prepared',
  REJECTED: 'rejected',
  READY_FOR_PICKUP: 'is ready for pickup',
  CANCELLED: 'cancelled',
  OUT_FOR_DELIVERY: 'is out for delivery',
  DELIVERED: 'delivered',
};

export const NO_ACCESS_MESSAGE = "You don't have access to that.";

export const ORDERS_PAGE_SIZE = 20;
