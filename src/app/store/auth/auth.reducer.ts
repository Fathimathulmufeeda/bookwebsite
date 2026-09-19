import { createReducer, on } from '@ngrx/store';
import { initialAuthState } from './auth.state';
import { loginSuccess, loginFailure, logout,login } from './auth.action';

export const authReducer = createReducer(
  initialAuthState,
  
  on(login, (state) => ({
    ...state,
    error: null
  })),

  on(loginSuccess, (state, { user }) => ({
    ...state,
    user: user,
    loggedIn: true,
    error:null
  })),

  on(loginFailure, (state, { message }) => ({
    ...state,
    user: null,
    loggedIn: false,
    error: message
  })),

  on(logout, () => ({
    user: null,
    loggedIn: false,
    error: null
  }))
);