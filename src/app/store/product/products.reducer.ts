import { createReducer, on } from '@ngrx/store';
import { Product } from '../../core/Models/Product.model';
import { loadProducts, loadProductsFailure, loadProductsSuccess } from './products.action';

export interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null
};

export const productsReducer = createReducer(
  initialState,
  on(loadProducts, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(loadProductsSuccess, (state, { products }) => ({
    ...state,
    products,
    loading: false,
    error: null
  })),
  on(loadProductsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);