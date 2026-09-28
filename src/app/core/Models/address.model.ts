export interface SavedAddress {
  id: string;
  userId: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  isDefault?: boolean;
}
