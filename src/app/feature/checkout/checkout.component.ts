import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { selectCartItems, selectCartTotal } from '../../store/cart/cart.selectors';
import { CommonModule } from '@angular/common';
import { addOrder } from '../../store/orders/orders.action';
import { take } from 'rxjs';
import { clearCart } from '../../store/cart/cart.action';
import { Router, RouterLink } from '@angular/router';
import { Product } from '../../core/Models/Product.model';
import { Order, PaymentMethod } from '../../core/Models/order.model';
import { SavedAddress } from '../../core/Models/address.model';

import { AuthService } from '../../core/services/auth.service';
import { AddressService } from '../../core/services/address.service';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

import { NAME_PATTERN, PHONE_PATTERN, PINCODE_PATTERN } from '../../shared/validators/custom-validators';


@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  buyNowProduct: Product | null = null;

  private store = inject(Store);
  private router = inject(Router);
  private authService = inject(AuthService);
  private addressService = inject(AddressService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  cartItems$ = this.store.select(selectCartItems);
  cartTotal$ = this.store.select(selectCartTotal);

  addresses: SavedAddress[] = [];
  selectedAddressId: string | null = null;

  showAddressForm = false;
  editingAddressId: string | null = null;

  paymentMethod: PaymentMethod = 'COD';

  submitting = false;

  addressForm = new FormGroup({

    name: new FormControl('', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      Validators.pattern(NAME_PATTERN)
    ]),

    phone: new FormControl('', [
      Validators.required,
      Validators.pattern(PHONE_PATTERN)
    ]),

    address: new FormControl('', [
      Validators.required,
      Validators.minLength(10),
      Validators.maxLength(200)
    ]),

    city: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[A-Za-z ]+$/)
    ]),

    state: new FormControl(''),

    pincode: new FormControl('', [
      Validators.required,
      Validators.pattern(PINCODE_PATTERN)
    ])

  });

  ngOnInit(): void {

    // Defense in depth: the route already has authGuard, but a stale
    // session (e.g. cleared in another tab) should still bounce to login.
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    if (typeof history !== 'undefined') {

      const state = history.state;

      if (state?.buyNowProduct) {
        this.buyNowProduct = state.buyNowProduct;
      }
    }

    this.loadAddresses();
    this.prefillName();
  }

  private loadAddresses(): void {
    this.addresses = this.addressService.getAddresses();

    const defaultAddress = this.addresses.find(a => a.isDefault) ?? this.addresses[0];

    this.selectedAddressId = defaultAddress?.id ?? null;

    if (this.addresses.length === 0) {
      this.showAddressForm = true;
    }
  }

  private prefillName(): void {
    const user = this.authService.getCurrentUser();

    if (user?.name && !this.addressForm.controls.name.value) {
      this.addressForm.controls.name.setValue(user.name);
    }
  }

  selectAddress(id: string): void {
    this.selectedAddressId = id;
    this.showAddressForm = false;
    this.editingAddressId = null;
  }

  openAddForm(): void {
    this.editingAddressId = null;
    this.addressForm.reset();
    this.prefillName();
    this.showAddressForm = true;
  }

  openEditForm(address: SavedAddress): void {
    this.editingAddressId = address.id;
    this.addressForm.setValue({
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state ?? '',
      pincode: address.pincode
    });
    this.showAddressForm = true;
  }

  cancelAddressForm(): void {
    this.showAddressForm = false;
    this.editingAddressId = null;
    this.addressForm.reset();
  }

  saveAddress(): void {

    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const value = this.addressForm.value;

    const payload = {
      name: value.name!.trim(),
      phone: value.phone!.trim(),
      address: value.address!.trim(),
      city: value.city!.trim(),
      state: value.state?.trim() || undefined,
      pincode: value.pincode!.trim(),
      isDefault: this.addresses.length === 0
    };

    if (this.editingAddressId) {
      this.addressService.updateAddress(this.editingAddressId, payload);
      this.toast.success('Address updated.');
    } else {
      const created = this.addressService.addAddress(payload);
      this.selectedAddressId = created.id;
      this.toast.success('Address added.');
    }

    this.loadAddresses();
    this.showAddressForm = false;
    this.editingAddressId = null;
    this.addressForm.reset();
  }

  async deleteAddress(address: SavedAddress, event: Event): Promise<void> {

    event.stopPropagation();

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete address?',
      message: `Remove the address for "${address.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    this.addressService.deleteAddress(address.id);
    this.toast.success('Address removed.');
    this.loadAddresses();
  }

  get selectedAddress(): SavedAddress | undefined {
    return this.addresses.find(a => a.id === this.selectedAddressId);
  }

  get canPlaceOrder(): boolean {
    return !!this.selectedAddress && !this.submitting;
  }

  placeOrder(): void {

    if (!this.selectedAddress) {
      this.toast.error('Please select or add a delivery address to continue.');
      return;
    }

    if (this.submitting) {
      return;
    }

    this.submitting = true;

    const address = this.selectedAddress;
    const user = this.authService.getCurrentUser();

    const shippingAddress = {
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode
    };

    // BUY NOW
    if (this.buyNowProduct) {

      const items = [
        {
          product: this.buyNowProduct,
          quantity: 1
        }
      ];

      const total = this.buyNowProduct.price;

      const order: Order = {
        id: Date.now(),
        userId: user?.id,
        items,
        total,
        shippingAddress,
        paymentMethod: this.paymentMethod,
        createdAt: new Date().toISOString(),
        status: 'Placed'
      };

      this.store.dispatch(addOrder({ order }));

      this.submitting = false;

      this.router.navigate(['/order-success']);

      return;
    }

    // NORMAL CART CHECKOUT
    this.store
      .select(selectCartItems)
      .pipe(take(1))
      .subscribe(items => {

        if (items.length === 0) {
          this.submitting = false;
          this.toast.error('Your cart is empty.');
          this.router.navigate(['/cart']);
          return;
        }

        const total = items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );

        const order: Order = {
          id: Date.now(),
          userId: user?.id,
          items,
          total,
          shippingAddress,
          paymentMethod: this.paymentMethod,
          createdAt: new Date().toISOString(),
          status: 'Placed'
        };

        this.store.dispatch(addOrder({ order }));

        this.store.dispatch(clearCart());

        this.submitting = false;

        this.router.navigate(['/order-success']);
      });
  }

}
