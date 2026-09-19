import { User } from "../../core/Models/user.model";

export interface AuthState {
    user: User | null;
    loggedIn: boolean;
    error: string | null;
  }

export const initialAuthState: AuthState = {
    user: null,
    loggedIn: false,
    error:null
  };