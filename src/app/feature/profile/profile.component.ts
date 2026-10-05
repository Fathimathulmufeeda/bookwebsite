
import { Component, HostListener, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { AuthService } from '../../core/services/auth.service';
import { AddressService } from '../../core/services/address.service';
import { SavedAddress } from '../../core/Models/address.model';

import {
  NAME_PATTERN,
  PHONE_PATTERN,
  PINCODE_PATTERN
} from '../../shared/validators/custom-validators';

import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';

import {
  ImageCropperComponent,
  fileToDataUrl,
  validateImageFile
} from '../../shared/components/image-cropper/image-cropper';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ImageCropperComponent
  ],
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

  // ============================================================
  // PROFILE PHOTO
  // ============================================================

  showPhotoMenu = false;

  cropSource: string | null = null;

  photoError = '';

  savingPhoto = false;

  // ============================================================
  // ADDRESS FORM
  // ============================================================

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

  // ============================================================
  // INITIAL LOAD
  // ============================================================

  ngOnInit(): void {
    this.loadAddresses();
  }

  // ============================================================
  // PROFILE PHOTO MENU
  // ============================================================

  togglePhotoMenu(): void {

    if (this.savingPhoto) {
      return;
    }

    this.showPhotoMenu = !this.showPhotoMenu;
  }

  // ============================================================
  // SELECT NEW PROFILE PHOTO
  // ============================================================

  async onPhotoSelected(event: Event): Promise<void> {

    this.showPhotoMenu = false;

    const input = event.target as HTMLInputElement;

    const file = input.files?.[0];

    // Allows selecting the same file again
    input.value = '';

    if (!file) {
      return;
    }

    const problem = validateImageFile(file, 5);

    if (problem) {
      this.photoError = problem;
      return;
    }

    this.photoError = '';

    try {

      this.cropSource = await fileToDataUrl(file);

    } catch {

      this.photoError =
        'Unable to read the selected image.';

    }
  }

  // ============================================================
  // EDIT CURRENT PROFILE PHOTO
  // ============================================================

  editCurrentPhoto(): void {

    this.showPhotoMenu = false;

    const photo = this.user?.profilePicture;

    if (!photo) {
      return;
    }

    /*
     * Photos uploaded through this profile page
     * are stored as data URLs.
     *
     * Only data URLs can be edited directly
     * by the cropper.
     */

    if (!photo.startsWith('data:')) {

      this.photoError =
        'This photo is an external link and cannot be edited. Upload a new photo instead.';

      return;
    }

    this.photoError = '';

    this.cropSource = photo;
  }

  // ============================================================
  // PHOTO CROPPED
  // ============================================================

  onPhotoCropped(dataUrl: string): void {

    this.cropSource = null;

    this.savePhoto(dataUrl);
  }

  // ============================================================
  // CANCEL CROP
  // ============================================================

  onCropCancelled(): void {

    this.cropSource = null;
  }

  // ============================================================
  // REMOVE PROFILE PHOTO
  // ============================================================

  async removePhoto(): Promise<void> {

    this.showPhotoMenu = false;

    const confirmed = await this.confirmDialog.confirm({

      title: 'Remove Photo',

      message:
        'Are you sure you want to remove your profile photo?',

      confirmText: 'Remove',

      cancelText: 'Cancel',

      danger: true

    });

    if (!confirmed) {
      return;
    }

    this.savePhoto('');
  }

  // ============================================================
  // SAVE PROFILE PHOTO
  // ============================================================

  private savePhoto(profilePicture: string): void {

    this.savingPhoto = true;

    this.photoError = '';

    this.authService
      .updateProfilePicture(profilePicture)
      .subscribe({

        next: (updatedUser) => {

          this.user = updatedUser;

          this.savingPhoto = false;
        },

        error: () => {

          this.photoError =
            'Unable to update your profile photo.';

          this.savingPhoto = false;
        }

      });
  }

  // ============================================================
  // LOAD ADDRESSES
  // ============================================================

  loadAddresses(): void {

    /*
     * AddressService already gets the logged-in
     * user's ID internally.
     *
     * Therefore we call getAddresses() without
     * passing the user ID.
     */

    this.addressService
      .getAddresses()
      .subscribe({

        next: (addresses) => {

          this.addresses = addresses;

        },

        error: () => {

          this.addresses = [];

        }

      });
  }

  // ============================================================
  // CHECK ADDRESS FIELD INVALID
  // ============================================================

  isInvalid(
    field:
      | 'name'
      | 'phone'
      | 'address'
      | 'city'
      | 'state'
      | 'pincode'
  ): boolean {

    const control = this.addressForm.controls[field];

    return control.invalid &&
      (control.touched || control.dirty);
  }

  // ============================================================
  // ADD ADDRESS
  // ============================================================

  openAddAddress(): void {
    this.editingAddressId = null;

    this.showAddressForm = true;

    this.addressForm.reset({

      name: this.user?.name ?? '',

      phone: '',

      address: '',

      city: '',

      state: '',

      pincode: '',

      /*
       * If there are no addresses,
       * this address becomes default.
       */
      isDefault: this.addresses.length === 0

    });
  }

  // ============================================================
  // EDIT ADDRESS
  // ============================================================

  openEditAddress(address: SavedAddress): void {

    this.editingAddressId = address.id;

    this.showAddressForm = true;

    this.addressForm.patchValue({

      name: address.name,

      phone: address.phone,

      address: address.address,

      city: address.city,

      state: address.state ?? '',

      pincode: address.pincode,

      isDefault: address.isDefault ?? false

    });
  }

  // ============================================================
  // CLOSE ADDRESS FORM
  // ============================================================

  closeAddressForm(): void {

    this.showAddressForm = false;

    this.editingAddressId = null;

    this.addressForm.reset({

      name: this.user?.name ?? '',

      phone: '',

      address: '',

      city: '',

      state: '',

      pincode: '',

      isDefault: false

    });
  }

  // ============================================================
  // SAVE ADDRESS
  // ============================================================

  saveAddress(): void {

    if (this.addressForm.invalid) {

      this.addressForm.markAllAsTouched();

      return;
    }

    const formValue =
      this.addressForm.getRawValue();

    /*
     * IMPORTANT:
     *
     * AddressService.addAddress() expects:
     * Omit<SavedAddress, 'id' | 'userId'>
     *
     * So we do NOT create id/userId here.
     *
     * AddressService creates them automatically.
     */

    const address: Omit<
      SavedAddress,
      'id' | 'userId'
    > = {

      name: formValue.name.trim(),

      phone: formValue.phone.trim(),

      address: formValue.address.trim(),

      city: formValue.city.trim(),

      state: formValue.state.trim(),

      pincode: formValue.pincode.trim(),

      isDefault: formValue.isDefault

    };

    // ========================================================
    // UPDATE EXISTING ADDRESS
    // ========================================================

    if (this.editingAddressId) {

      this.addressService
        .updateAddress(
          this.editingAddressId,
          address
        )
        .subscribe({

          next: () => {

            this.loadAddresses();

            this.closeAddressForm();

          }

        });

      return;
    }

    // ========================================================
    // ADD NEW ADDRESS
    // ========================================================

    this.addressService
      .addAddress(address)
      .subscribe({

        next: () => {

          this.loadAddresses();

          this.closeAddressForm();

        }

      });
  }

  // ============================================================
  // DELETE ADDRESS
  // ============================================================

  async deleteAddress(id: string): Promise<void> {

    const confirmed =
      await this.confirmDialog.confirm({

        title: 'Delete Address',

        message:
          'Are you sure you want to delete this saved address?',

        confirmText: 'Delete',

        cancelText: 'Cancel',

        danger: true

      });

    if (!confirmed) {
      return;
    }

    this.addressService
      .deleteAddress(id)
      .subscribe({

        next: () => {

          this.loadAddresses();

        }

      });
  }

  // ============================================================
  // MAKE ADDRESS DEFAULT
  // ============================================================

  makeDefault(id: string): void {

    this.addressService
      .setDefault(id)
      .subscribe({

        next: () => {

          this.loadAddresses();

        }

      });
  }
  @HostListener('document:click', ['$event'])
onDocumentClick(event: MouseEvent): void {
  const target = event.target as HTMLElement;

  if (!target.closest('.photo-menu-container')) {
    this.showPhotoMenu = false;
  }
}
}
