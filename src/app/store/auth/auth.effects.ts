import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, switchMap, catchError, of } from 'rxjs';

import { login,loginSuccess,loginFailure } from './auth.action';
import { AuthService } from '../../core/services/auth.service';

@Injectable()
export class AuthEffects {

  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(login),
  
      switchMap(({ email,password }) =>
        this.authService.login(email).pipe(
            map((users) => {
                if (users.length === 0) {
                  return loginFailure({ message: 'Email does not exist' });
                }
                const user = users[0];

                if (password !== user.password) {
                    return loginFailure({ message: 'Incorrect password' });
                }

                return loginSuccess({ user });
              }),
          catchError(() =>
            of(loginFailure({ message: 'Login failed' }))
          )
        )
      )
    )
  );


}