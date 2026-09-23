import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { selectLatestOrder } from '../../store/orders/orders.selectors';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-order-success',
  standalone: true,
  imports: [RouterLink, CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './order-success.component.html',
  styleUrl: './order-success.component.css'
})
export class OrderSuccessComponent {
  private store = inject(Store);
  order$ = this.store.select(selectLatestOrder);

}
