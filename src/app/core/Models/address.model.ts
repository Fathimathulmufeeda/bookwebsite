export interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  isDefault?: boolean;
}
