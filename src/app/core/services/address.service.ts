import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {forkJoin,Observable,of,switchMap} from 'rxjs';

import { SavedAddress } from '../Models/address.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AddressService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly MAX_ADDRESS=3

  private apiUrl = 'http://localhost:3000/addresses';


  // Get the currently logged-in user's ID
  private getUserId(): string | null {

    const user = this.authService.getCurrentUser();

    if (!user) {
      return null;
    }

    return String(user.id);
  }


  // Get addresses belonging only to the logged-in user
  getAddresses(): Observable<SavedAddress[]> {

    const userId = this.getUserId();

    if (!userId) {
      return of([]);
    }

    return this.http.get<SavedAddress[]>(
      `${this.apiUrl}?userId=${encodeURIComponent(userId)}` //It safely encodes values before putting them into URLs.
    );
  }


  // Add a new address
  addAddress(
    address: Omit<SavedAddress, 'id' | 'userId'>
  ): Observable<SavedAddress> {

    const userId = this.getUserId();

    if (!userId) {
      throw new Error('User is not logged in');
    }
    
    

    const newAddress: SavedAddress = {
      ...address,
      id: `addr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId
    };

    return this.getAddresses().pipe(

      switchMap(addresses => {

        // if(addresses.length>=this.MAX_ADDRESS){
        //   throw new Error('you can only save maximum of ${this.MAX_ADDRESS}adddress')
        // }

        // First address automatically becomes default
        if (addresses.length === 0) {
          newAddress.isDefault = true;
        }

        // If new address is default,
        // make all existing addresses non-default
        if (newAddress.isDefault) {

          const updateRequests = addresses.map(address =>
            this.http.patch(
              `${this.apiUrl}/${encodeURIComponent(address.id)}`,
              {
                isDefault: false
              }
            )
          );

          if (updateRequests.length === 0) {

            return this.http.post<SavedAddress>(
              this.apiUrl,
              newAddress
            );
          }

          return forkJoin(updateRequests).pipe(

            switchMap(() =>
              this.http.post<SavedAddress>(
                this.apiUrl,
                newAddress
              )
            )
          );
        }

        return this.http.post<SavedAddress>(
          this.apiUrl,
          newAddress
        );
      })
    );
  }


  // Update an existing address
  updateAddress(
    id: string,
    address: Omit<SavedAddress, 'id' | 'userId'>
  ): Observable<SavedAddress> {

    const userId = this.getUserId();

    if (!userId) {
      throw new Error('User is not logged in');
    }

    // If this address is being made default,
    // remove default status from other addresses
    if (address.isDefault) {

      return this.getAddresses().pipe(

        switchMap(addresses => {

          const updateRequests = addresses
            .filter(address => address.id !== id)
            .map(address =>
              this.http.patch(
                `${this.apiUrl}/${encodeURIComponent(address.id)}`,
                {
                  isDefault: false
                }
              )
            );

          if (updateRequests.length === 0) {

            return this.http.put<SavedAddress>(
              `${this.apiUrl}/${encodeURIComponent(id)}`,
              {
                ...address,
                id,
                userId
              }
            );
          }

          return forkJoin(updateRequests).pipe(

            switchMap(() =>
              this.http.put<SavedAddress>(
                `${this.apiUrl}/${encodeURIComponent(id)}`,
                {
                  ...address,
                  id,
                  userId
                }
              )
            )
          );
        })
      );
    }

    return this.http.put<SavedAddress>(
      `${this.apiUrl}/${encodeURIComponent(id)}`,
      {
        ...address,
        id,
        userId
      }
    );
  }


  // Delete an address
  deleteAddress(id: string): Observable<void> {

    return this.http.delete<void>(
      `${this.apiUrl}/${encodeURIComponent(id)}`
    );
  }


  // Make an address the default address
  setDefault(id: string): Observable<SavedAddress> {

    return this.getAddresses().pipe(

      switchMap(addresses => {

        const updateRequests = addresses.map(address =>
          this.http.patch(
            `${this.apiUrl}/${encodeURIComponent(address.id)}`,
            {
              isDefault: address.id === id
            }
          )
        );

        return forkJoin(updateRequests).pipe(

          switchMap(() =>
            this.http.get<SavedAddress>(
              `${this.apiUrl}/${encodeURIComponent(id)}`
            )
          )
        );
      })
    );
  }

}