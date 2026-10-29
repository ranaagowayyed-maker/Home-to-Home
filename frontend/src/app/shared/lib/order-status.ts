export type OrderStatus =
  | 'PLACED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'REJECTED'
  | 'CANCELLED';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PLACED: 'Placed',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready for pickup',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

/** Statuses an order never leaves; polling stops once one is reached. */
export const TERMINAL_STATUSES: readonly OrderStatus[] = ['DELIVERED', 'REJECTED', 'CANCELLED'];

export const isTerminalStatus = (status: OrderStatus): boolean =>
  TERMINAL_STATUSES.includes(status);
