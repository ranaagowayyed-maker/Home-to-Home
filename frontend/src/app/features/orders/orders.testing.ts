import { OrderDetail } from './orders.models';

export const orderDetail = (overrides: Partial<OrderDetail> = {}): OrderDetail => ({
  id: 'o1',
  number: 1042,
  status: 'PLACED',
  createdAt: '2026-10-18T10:00:00Z',
  kitchenName: "Fatima's Kitchen",
  motherId: 'mother-a',
  items: [
    {
      mealId: 'm1',
      name: 'Stuffed Grape Leaves',
      unitPriceMinor: 1250,
      quantity: 2,
      lineTotalMinor: 2500,
    },
  ],
  subtotalMinor: 2500,
  deliveryFeeMinor: 1500,
  totalMinor: 4000,
  paymentMethod: 'CASH_ON_DELIVERY',
  deliveryAddress: '12 Nile Street, Cairo',
  customerPhone: '+20 100 000 0000',
  notes: null,
  customerName: 'Sara',
  mother: { name: 'Fatima', phone: '+20 100 123 4567', address: '5 Tahrir Square' },
  deliveryPerson: null,
  timeline: [{ status: 'PLACED', at: '2026-10-18T10:00:00Z' }],
  allowedActions: [],
  ...overrides,
});
