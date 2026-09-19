import { createFeatureSelector, createSelector } from '@ngrx/store';
import { ProductState } from './products.reducer';

export const selectProductState =
  createFeatureSelector<ProductState>('products');

export const selectProducts = createSelector(
  selectProductState,
  state => state.products
);
export const selectProductsLoading = createSelector(
    selectProductState,
    state => state.loading
  );
export const selectProductsError = createSelector(
    selectProductState,
    state => state.error
  );