import { Component, inject, OnInit } from '@angular/core';
import {FormControl,FormGroup,ReactiveFormsModule,Validators} from '@angular/forms';
import { Store } from '@ngrx/store';
import { selectCartItems, selectCartTotal } from '../../store/cart/cart.selectors';
import { CommonModule } from '@angular/common';
import { addOrder } from '../../store/orders/orders.action';
import { take } from 'rxjs';
import { clearCart } from '../../store/cart/cart.action';
import { Router } from '@angular/router';
import { Product } from '../../core/Models/Product.model';


@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {
  buyNowProduct: Product | null = null;
  private store = inject(Store);
  private router = inject(Router);

cartItems$ = this.store.select(selectCartItems);
cartTotal$ = this.store.select(selectCartTotal);

  checkoutForm = new FormGroup({

    name: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      Validators.pattern(/^[A-Za-z ]+$/)
    ]),

    address: new FormControl('', [
      Validators.required,
      Validators.minLength(10)
    ]),

    city: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[A-Za-z ]+$/)
    ]),

    pincode: new FormControl('', [
      Validators.required,
      Validators.pattern(/^[0-9]{6}$/)
    ])

  });

  placeOrder(): void {

    if (this.checkoutForm.invalid) {
      return;
    }
  
    // BUY NOW
    if (this.buyNowProduct) {
  
      const items = [
        {
          product: this.buyNowProduct,
          quantity: 1
        }
      ];
  
      const total =
        this.buyNowProduct.price;
  
      const order = {
        id: Date.now(),
        items: items,
        total: total,
        shippingAddress: {
          name: this.checkoutForm.value.name!,
          address: this.checkoutForm.value.address!,
          city: this.checkoutForm.value.city!,
          pincode: this.checkoutForm.value.pincode!
        },
        createdAt: new Date().toISOString(),
        status: 'Placed' as const
      };
  
      this.store.dispatch(
        addOrder({ order })
      );
  
      
      this.router.navigate(['/order-success']);
  
      console.log('Buy Now order placed:', order);
  
      return;
    }
  
    // NORMAL CART CHECKOUT
    this.store
      .select(selectCartItems)
      .pipe(take(1))
      .subscribe(items => {
  
        const total = items.reduce(
          (sum, item) =>
            sum + item.product.price * item.quantity,
          0
        );
  
        const order = {
          id: Date.now(),
          items: items,
          total: total,
          shippingAddress: {
            name: this.checkoutForm.value.name!,
            address: this.checkoutForm.value.address!,
            city: this.checkoutForm.value.city!,
            pincode: this.checkoutForm.value.pincode!
          },
          createdAt: new Date().toISOString(),
          status: 'Placed' as const
        };
  
        this.store.dispatch(
          addOrder({ order })
        );
  
        this.store.dispatch(clearCart());
  
        this.router.navigate(['/order-success']);
  
        console.log('Order placed:', order);
      });
  }
  ngOnInit(): void {
    const state = history.state;
  
    if (state?.buyNowProduct) {
      this.buyNowProduct = state.buyNowProduct;
    }
  }

}