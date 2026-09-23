import { Injectable, inject } from '@angular/core';
import { SavedAddress } from '../Models/address.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AddressService {

  private authService = inject(AuthService);

  private storageKey(): string {
    const user = this.authService.getCurrentUser();
    return `nova_addresses_${user?.id ?? 'guest'}`;
  }

  getAddresses(): SavedAddress[] {

    if (typeof localStorage === 'undefined') {
      return [];
    }

    const raw = localStorage.getItem(this.storageKey());

    return raw ? JSON.parse(raw) : [];
  }

  private persist(list: SavedAddress[]): void {

    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(this.storageKey(), JSON.stringify(list));
  }

  addAddress(address: Omit<SavedAddress, 'id'>): SavedAddress {

    const list = this.getAddresses();

    const newAddress: SavedAddress = {
      ...address,
      id: `addr_${Date.now()}_${Math.floor(Math.random() * 1000)}`
    };

    if (list.length === 0) {
      newAddress.isDefault = true;
    }

    if (newAddress.isDefault) {
      list.forEach(a => a.isDefault = false);
    }

    const updated = [...list, newAddress];

    this.persist(updated);

    return newAddress;
  }

  updateAddress(id: string, address: Omit<SavedAddress, 'id'>): void {

    const list = this.getAddresses();

    if (address.isDefault) {
      list.forEach(a => a.isDefault = false);
    }

    const updated = list.map(a => a.id === id ? { ...address, id } : a);

    this.persist(updated);
  }

  deleteAddress(id: string): void {

    let list = this.getAddresses().filter(a => a.id !== id);

    if (list.length > 0 && !list.some(a => a.isDefault)) {
      list = list.map((a, index) => index === 0 ? { ...a, isDefault: true } : a);
    }

    this.persist(list);
  }

  setDefault(id: string): void {

    const list = this.getAddresses().map(a => ({
      ...a,
      isDefault: a.id === id
    }));

    this.persist(list);
  }
}
