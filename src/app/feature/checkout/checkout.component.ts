import { Component, inject, OnInit } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { Store } from '@ngrx/store';

import {
  selectCartItems,
  selectCartTotal
} from '../../store/cart/cart.selectors';

import { CommonModule } from '@angular/common';

import {
  addOrder,
  addOrderSuccess,
  addOrderFailure
} from '../../store/orders/orders.action';

import { Actions, ofType } from '@ngrx/effects';

import { take } from 'rxjs';

import { clearCart } from '../../store/cart/cart.action';

import {
  Router,
  RouterLink
} from '@angular/router';

import { Product } from '../../core/Models/Product.model';

import {
  Order,
  PaymentMethod
} from '../../core/Models/order.model';

import { SavedAddress } from '../../core/Models/address.model';

import { AuthService } from '../../core/services/auth.service';
import { AddressService } from '../../core/services/address.service';

import { ToastService } from '../../shared/services/toast.service';

import {
  ConfirmDialogService
} from '../../shared/services/confirm-dialog.service';

import {
  HeaderComponent
} from '../../shared/components/header/header.component';

import {
  FooterComponent
} from '../../shared/components/footer/footer.component';

import {
  NAME_PATTERN,
  PHONE_PATTERN,
  PINCODE_PATTERN
} from '../../shared/validators/custom-validators';


@Component({
  selector: 'app-checkout',
  standalone: true,

  imports: [
    ReactiveFormsModule,
    CommonModule,
    RouterLink,
    HeaderComponent,
    FooterComponent
  ],

  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  buyNowProduct: Product | null = null;
  private store = inject(Store);

  private actions$ = inject(Actions);

  private router = inject(Router);

  private authService = inject(AuthService);

  private addressService = inject(AddressService);

  private toast = inject(ToastService);

  private confirmDialog = inject(ConfirmDialogService);

  cartItems$ = this.store.select(selectCartItems);

  cartTotal$ = this.store.select(selectCartTotal);

  addresses: SavedAddress[] = [];

  selectedAddressId: string | null = null;
  
  readonly maxAddresses = 3;
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

  upiForm = new FormGroup({

    upiId: new FormControl('', [
      Validators.required,
      Validators.pattern(
        /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/
      )
    ])

  });


  ngOnInit(): void {

    // User must be logged in
    if (!this.authService.isLoggedIn()) {

      this.router.navigate(['/login']);

      return;
    }


    // Check whether this is Buy Now
    if (typeof history !== 'undefined') {

      const state = history.state;

      if (state?.buyNowProduct) {

        this.buyNowProduct =
          state.buyNowProduct;
      }
    }


    // Load saved addresses
    this.loadAddresses();

    // Prefill logged-in user's name
    this.prefillName();
  }


  private loadAddresses(): void {

    this.addressService.getAddresses().subscribe({

      next: addresses => {

        this.addresses = addresses;


        // Check whether currently selected address
        // still exists
        const selectedStillExists =
          this.addresses.some(
            address =>
              address.id === this.selectedAddressId
          );


        // If selected address does not exist,
        // choose default address
        if (!selectedStillExists) {

          const defaultAddress =
            this.addresses.find(
              address => address.isDefault
            ) ??
            this.addresses[0];


          this.selectedAddressId =
            defaultAddress?.id ?? null;
        }


        // If there are no addresses,
        // automatically open address form
        if (this.addresses.length === 0) {

          this.showAddressForm = true;
        }

      },

      error: error => {

        console.error(
          'Failed to load addresses:',
          error
        );

        this.addresses = [];

        this.selectedAddressId = null;

        this.showAddressForm = true;
      }

    });
  }


  // ==================================================
  // PREFILL USER NAME
  // ==================================================

  private prefillName(): void {

    const user =
      this.authService.getCurrentUser();


    if (
      user?.name &&
      !this.addressForm.controls.name.value
    ) {

      this.addressForm.controls.name
        .setValue(user.name);
    }
  }


  // ==================================================
  // SELECT ADDRESS
  // ==================================================

  selectAddress(id: string): void {

    this.selectedAddressId = id;

    this.showAddressForm = false;

    this.editingAddressId = null;
  }



  openAddForm(): void {
    if (this.addresses.length >= this.maxAddresses) {
      this.toast.info('You can save a maximum of 3 addresses.');
      return;
    }
  
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

    // Validate form
    if (this.addressForm.invalid) {

      this.addressForm.markAllAsTouched();

      return;
    }


    const value =
      this.addressForm.value;


    const payload = {

      name: value.name!.trim(),

      phone: value.phone!.trim(),

      address: value.address!.trim(),

      city: value.city!.trim(),

      state:
        value.state?.trim() || undefined,

      pincode: value.pincode!.trim(),

      isDefault:
        this.addresses.length === 0

    };


    if (this.editingAddressId) {

      this.addressService
        .updateAddress(
          this.editingAddressId,
          payload
        )
        .subscribe({

          next: () => {

            this.toast.success(
              'Address updated.'
            );

            this.showAddressForm = false;

            this.editingAddressId = null;

            this.addressForm.reset();

            this.loadAddresses();
          },

          error: error => {

            console.error(
              'Failed to update address:',
              error
            );

            this.toast.error(
              'Failed to update address.'
            );
          }

        });

      return;
    }



    this.addressService
      .addAddress(payload)
      .subscribe({

        next: created => {

          this.selectedAddressId =
            created.id;

          this.toast.success(
            'Address added.'
          );

          this.showAddressForm = false;

          this.editingAddressId = null;

          this.addressForm.reset();

          this.loadAddresses();
        },

        error: error => {

          console.error(
            'Failed to add address:',
            error
          );

          this.toast.error(
            'Failed to add address.'
          );
        }

      });
  }


  async deleteAddress(
    address: SavedAddress,
    event: Event
  ): Promise<void> {

    event.stopPropagation();


    const confirmed =
      await this.confirmDialog.confirm({

        title: 'Delete address?',

        message:
          `Remove the address for "${address.name}"? This cannot be undone.`,

        confirmText: 'Delete',

        cancelText: 'Cancel',

        danger: true

      });


    if (!confirmed) {

      return;
    }


    this.addressService
      .deleteAddress(address.id)
      .subscribe({

        next: () => {

          this.toast.success(
            'Address removed.'
          );

          this.loadAddresses();
        },

        error: error => {

          console.error(
            'Failed to delete address:',
            error
          );

          this.toast.error(
            'Failed to remove address.'
          );
        }

      });
  }


  // ==================================================
  // SELECTED ADDRESS
  // ==================================================

  get selectedAddress():
    SavedAddress | undefined {

    return this.addresses.find(
      address =>
        address.id === this.selectedAddressId
    );
  }


  // ==================================================
  // CAN PLACE ORDER
  // ==================================================

  get canPlaceOrder(): boolean {

    // Address required
    if (
      !this.selectedAddress ||
      this.submitting
    ) {

      return false;
    }


    // UPI requires valid UPI ID
    if (
      this.paymentMethod === 'UPI'
    ) {

      return this.upiForm.valid;
    }


    return true;
  }


  // ==================================================
  // SUBMIT ORDER
  // ==================================================

  private submitOrder(order: Order): void {

    // Start order process
    this.store.dispatch(
      addOrder({ order })
    );


    // Listen for success/failure
    this.actions$
      .pipe(

        ofType(
          addOrderSuccess,
          addOrderFailure
        ),

        take(1)

      )
      .subscribe(action => {

        this.submitting = false;


        // ==============================================
        // ORDER SUCCESS
        // ==============================================

        if (
          action.type ===
          addOrderSuccess.type
        ) {

          // Clear cart only after
          // order was successfully saved
          this.store.dispatch(
            clearCart()
          );


          // Go to success page
          this.router.navigate([
            '/order-success'
          ]);

          return;
        }


        // ==============================================
        // ORDER FAILURE
        // ==============================================

        this.toast.error(
          action.error ||
          'Failed to place order.'
        );

      });
  }


  // ==================================================
  // PLACE ORDER
  // ==================================================

  placeOrder(): void {

    // --------------------------------------------------
    // CHECK ADDRESS
    // --------------------------------------------------

    if (!this.selectedAddress) {

      this.toast.error(
        'Please select or add a delivery address to continue.'
      );

      return;
    }


    // Prevent duplicate clicks
    if (this.submitting) {

      return;
    }


    // --------------------------------------------------
    // CHECK UPI
    // --------------------------------------------------

    if (
      this.paymentMethod === 'UPI' &&
      this.upiForm.invalid
    ) {

      this.upiForm.controls.upiId
        .markAsTouched();

      this.toast.error(
        'Please enter a valid UPI ID.'
      );

      return;
    }


    this.submitting = true;


    // --------------------------------------------------
    // USER
    // --------------------------------------------------

    const user =
      this.authService.getCurrentUser();


    // --------------------------------------------------
    // SHIPPING ADDRESS
    // --------------------------------------------------

    const address =
      this.selectedAddress;


    const shippingAddress = {

      name: address.name,

      phone: address.phone,

      address: address.address,

      city: address.city,

      state: address.state,

      pincode: address.pincode

    };


    // ==================================================
    // BUY NOW
    // ==================================================

    if (this.buyNowProduct) {

      const items = [

        {

          product:
            this.buyNowProduct,

          quantity: 1

        }

      ];


      const total =
        this.buyNowProduct.price;


      const order: Order = {

        id: Date.now(),

        userId: user?.id,

        items,

        total,

        shippingAddress,

        paymentMethod:
          this.paymentMethod,

        createdAt:
          new Date().toISOString(),

        status: 'Placed'

      };


      // Send order through NgRx
      // → Effect
      // → OrderService
      // → Stock check
      // → Save order
      // → Reduce stock
      this.submitOrder(order);

      return;
    }


    // ==================================================
    // NORMAL CART CHECKOUT
    // ==================================================

    this.store
      .select(selectCartItems)
      .pipe(take(1))
      .subscribe(items => {


        // Empty cart
        if (items.length === 0) {

          this.submitting = false;

          this.toast.error(
            'Your cart is empty.'
          );

          this.router.navigate([
            '/cart'
          ]);

          return;
        }


        // Calculate total
        const total =
          items.reduce(

            (sum, item) =>
              sum +
              item.product.price *
              item.quantity,

            0

          );


        // Create order
        const order: Order = {

          id: Date.now(),

          userId: user?.id,

          items,

          total,

          shippingAddress,

          paymentMethod:
            this.paymentMethod,

          createdAt:
            new Date().toISOString(),

          status: 'Placed'

        };


        // Send order through NgRx
        this.submitOrder(order);

      });
  }

}