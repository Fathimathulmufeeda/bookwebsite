import { createAction, props } from '@ngrx/store';
import { CartItem } from '../../core/Models/cart-item.model';

export const addToCart = createAction(
  '[Cart] Add To Cart',
  props<{ item: CartItem }>()
);

export const increaseQuantity = createAction(
    '[Cart] Increase Quantity',
    props<{ productId: number }>()
);
export const decreaseQuantity = createAction(
    '[Cart] Decrease Quantity',
    props<{ productId: number }>()
);
export const removeFromCart = createAction(
    '[Cart] Remove From Cart',
    props<{ productId: number }>()
  );
export const clearCart = createAction(
    '[Cart] Clear Cart'
  );

  export const loadCart = createAction(
    '[Cart] Load Cart'
  );
  
  export const loadCartSuccess = createAction(
    '[Cart] Load Cart Success',
    props<{ items: CartItem[] }>()
  );
  export const addToCartSuccess = createAction(
    '[Cart] Add To Cart Success',
    props<{ item: CartItem }>()
  );