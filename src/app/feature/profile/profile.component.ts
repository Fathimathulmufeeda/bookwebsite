import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { AddressService } from '../../core/services/address.service';
import { SavedAddress } from '../../core/Models/address.model';
import { NAME_PATTERN, PHONE_PATTERN, PINCODE_PATTERN } from '../../shared/validators/custom-validators';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';


@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  private authService = inject(AuthService);
  private addressService = inject(AddressService);
  private fb = inject(FormBuilder);
  private confirmDialog = inject(ConfirmDialogService);

  user = this.authService.getCurrentUser();

  addresses: SavedAddress[] = [];

  showAddressForm = false;

  editingAddressId: string | null = null;

  addressForm = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(NAME_PATTERN)
      ]
    ],

    phone: [
      '',
      [
        Validators.required,
        Validators.pattern(PHONE_PATTERN)
      ]
    ],

    address: [
      '',
      [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(200)
      ]
    ],

    city: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]
    ],

    state: [
      '',
      [
        Validators.maxLength(50)
      ]
    ],

    pincode: [
      '',
      [
        Validators.required,
        Validators.pattern(PINCODE_PATTERN)
      ]
    ],

    isDefault: [false]
  });

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.addressService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses = addresses;
      },

      error: (error) => {
        console.error('Failed to load addresses', error);
      }
    });
  }

  openAddAddress(): void {

    this.editingAddressId = null;

    this.addressForm.reset({
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false
    });

    this.addressForm.markAsPristine();
    this.addressForm.markAsUntouched();

    this.showAddressForm = true;
  }

  openEditAddress(address: SavedAddress): void {

    this.editingAddressId = address.id;

    this.addressForm.reset({
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state ?? '',
      pincode: address.pincode,
      isDefault: address.isDefault ?? false
    });

    this.addressForm.markAsPristine();
    this.addressForm.markAsUntouched();

    this.showAddressForm = true;
  }

  closeAddressForm(): void {

    this.showAddressForm = false;

    this.editingAddressId = null;

    this.addressForm.reset({
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false
    });

    this.addressForm.markAsPristine();
    this.addressForm.markAsUntouched();
  }

  saveAddress(): void {

    if (this.addressForm.invalid) {

      this.addressForm.markAllAsTouched();

      return;
    }

    const addressData = this.addressForm.getRawValue();

    if (this.editingAddressId) {

      this.addressService
        .updateAddress(
          this.editingAddressId,
          addressData
        )
        .subscribe({
          next: () => {

            this.closeAddressForm();

            this.loadAddresses();
          },

          error: (error) => {
            console.error('Failed to update address', error);
          }
        });

    } else {

      this.addressService
        .addAddress(addressData)
        .subscribe({
          next: () => {

            this.closeAddressForm();

            this.loadAddresses();
          },

          error: (error) => {
            console.error('Failed to add address', error);
          }
        });
    }
  }

  deleteAddress(id: string): void {

    this.confirmDialog.confirm({
      title: 'Delete Address',
      message: 'Are you sure you want to delete this address?',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }).then((confirmed: boolean) => {
  
      if (!confirmed) {
        return;
      }
  
      this.addressService.deleteAddress(id).subscribe({
        next: () => {
          this.loadAddresses();
        },
  
        error: (error) => {
          console.error('Failed to delete address', error);
        }
      });
  
    });
  }

  makeDefault(id: string): void {

    this.addressService.setDefault(id).subscribe({
      next: () => {
        this.loadAddresses();
      },

      error: (error) => {
        console.error('Failed to set default address', error);
      }
    });
  }

  isInvalid(controlName: string): boolean {

    const control = this.addressForm.get(controlName);

    return !!control &&
      control.invalid &&
      (control.touched || control.dirty);
  }
}