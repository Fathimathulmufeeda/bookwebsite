import { CartItem } from './cart-item.model';

export interface Order {
  id: number;

  items: CartItem[];

  total: number;

  shippingAddress: {
    name: string;
    address: string;
    city: string;
    pincode: string;
  };

  createdAt: string;

  status: 'Placed';
}