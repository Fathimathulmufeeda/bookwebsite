import { CartItem } from './cart-item.model';

export type OrderStatus = 'Placed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

export type PaymentMethod = 'COD' | 'Card' | 'UPI';

export interface OrderAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
}

export interface Order {
  id: number;

  userId?: number;

  items: CartItem[];

  total: number;

  shippingAddress: OrderAddress;

  paymentMethod?: PaymentMethod;

  createdAt: string;

  status: OrderStatus;
}
