import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthState =
  createFeatureSelector<AuthState>('auth');

export const selectLoggedIn = createSelector(
    selectAuthState,
    (state) => state.loggedIn
  );
export const selectUser = createSelector(
    selectAuthState,
    (state) => state.user
  );
  export const selectAuthError = createSelector(
    selectAuthState,
    (state) => state.error
  );