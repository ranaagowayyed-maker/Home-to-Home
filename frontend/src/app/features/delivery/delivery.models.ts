export interface DeliveryRequestSummary {
  id: string;
  orderId: string;
  orderNumber: number;
  kitchenName: string;
  kitchenCity: string | null;
  customerCity: string | null;
  itemCount: number;
  deliveryFeeMinor: number;
  openedAt: string;
}

export interface DeliveryRequestList {
  items: DeliveryRequestSummary[];
  activeDeliveries: number;
  maxActiveDeliveries: number;
}

export const ACTIVE_LIMIT_MESSAGE = 'Finish an active delivery first.';
