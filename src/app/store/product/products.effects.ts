import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { loadProducts, loadProductsFailure, loadProductsSuccess } from './products.action';
import { ProductService } from '../../core/services/product.service';

@Injectable()
export class ProductsEffects {

  private actions$ = inject(Actions);
  private productService = inject(ProductService);
  loadProducts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadProducts),
  
      switchMap(() =>
        this.productService.getProducts().pipe(
  
          map(products =>
            loadProductsSuccess({ products })
          ),
          catchError(error =>
            of(
              loadProductsFailure({
                error: error.message
              })
            )
          )
  
        )
      )
    )
  );

}