
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
import { ToastService } from '../../shared/services/toast.service';
import { Router } from '@angular/router';

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
  private toastService = inject(ToastService);
  private router = inject(Router);

  user = this.authService.getCurrentUser();

  
  addresses: SavedAddress[] = [];

readonly MAX_ADDRESS = 3;

get canAddAddress(): boolean {
  return this.addresses.length < this.MAX_ADDRESS;
}

  showAddressForm = false;
  editingAddressId: string | null = null;



  showPhotoMenu = false;

  cropSource: string | null = null;

  photoError = '';

  savingPhoto = false;


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
  
  showProfileForm = false;
  savingProfile = false;
  
  profileForm = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(NAME_PATTERN)
      ]
    ],
    email: [
      '',
      [
        Validators.required,
        Validators.email,
        Validators.maxLength(254)
      ]
    ]
  });
  
openEditProfile(): void {
  if (!this.user || this.savingProfile) {
    return;
  }

  this.profileForm.reset({
    name: this.user.name,
    email: this.user.email
  });

  this.showProfileForm = true;
}

cancelEditProfile(): void {
  this.showProfileForm = false;

  this.profileForm.reset({
    name: this.user?.name ?? '',
    email: this.user?.email ?? ''
  });
}

saveProfile(): void {
  if (this.profileForm.invalid || this.savingProfile) {
    this.profileForm.markAllAsTouched();
    return;
  }

  const { name, email } = this.profileForm.getRawValue();

  const updatedName = name.trim();
  const updatedEmail = email.trim();

  if (
    updatedName === this.user?.name &&
    updatedEmail.toLowerCase() === this.user?.email.toLowerCase()
  ) {
    this.toastService.show('No changes to save.');
    this.cancelEditProfile();
    return;
  }

  this.savingProfile = true;

  this.authService
    .updateProfile(updatedName, updatedEmail)
    .subscribe({
      next: updatedUser => {
        this.user = updatedUser;
        this.savingProfile = false;
        this.showProfileForm = false;

        this.toastService.show(
          'Profile updated successfully.'
        );
      },

      error: error => {
        this.savingProfile = false;

        if (error?.message === 'EMAIL_EXISTS') {
          this.toastService.show(
            'This email is already registered.'
          );
        } else if (error?.message === 'NOT_LOGGED_IN') {
          this.toastService.show(
            'Please log in to update your profile.'
          );
        } else {
          this.toastService.show(
            'Unable to update your profile. Please try again.'
          );
        }
      }
    });
}

async logout(): Promise<void> {
  const confirmed = await this.confirmDialog.confirm({
    title: 'Logout',
    message: 'Are you sure you want to log out?',
    confirmText: 'Logout',
    cancelText: 'Cancel',
    danger: true
  });

  if (!confirmed) {
    return;
  }

  this.authService.logout();

  this.router.navigate(['/home']);
}

  ngOnInit(): void {
    this.loadAddresses();
  }

  togglePhotoMenu(): void {

    if (this.savingPhoto) {
      return;
    }

    this.showPhotoMenu = !this.showPhotoMenu;
  }

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


  editCurrentPhoto(): void {

    this.showPhotoMenu = false;

    const photo = this.user?.profilePicture;

    if (!photo) {
      return;
    }


    if (!photo.startsWith('data:')) {

      this.photoError =
        'This photo is an external link and cannot be edited. Upload a new photo instead.';

      return;
    }

    this.photoError = '';

    this.cropSource = photo;
  }

  onPhotoCropped(dataUrl: string): void {

    this.cropSource = null;

    this.savePhoto(dataUrl);
  }


  onCropCancelled(): void {

    this.cropSource = null;
  }

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

  loadAddresses(): void {
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


  openAddAddress(): void {
    if (!this.canAddAddress) {
      this.toastService.show(
        `You can save a maximum of ${this.MAX_ADDRESS} addresses.`
      );
      return;
    }
    this.editingAddressId = null;

    this.showAddressForm = true;

    this.addressForm.reset({

      name: this.user?.name ?? '',

      phone: '',

      address: '',

      city: '',

      state: '',

      pincode: '',

      
      isDefault: this.addresses.length === 0

    });
  }

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

  saveAddress(): void {

    if (this.addressForm.invalid) {

      this.addressForm.markAllAsTouched();

      return;
    }

    const formValue =
      this.addressForm.getRawValue();

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

    // ADD NEW ADDRESS
  

    this.addressService
      .addAddress(address)
      .subscribe({

        next: () => {

          this.loadAddresses();

          this.closeAddressForm();

        }

      });
  }


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
