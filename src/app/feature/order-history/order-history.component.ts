import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectOrders } from '../../store/orders/orders.selectors';
import { CommonModule } from '@angular/common';
import { loadOrders } from '../../store/orders/orders.action';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {

  private store = inject(Store);

  orders$ = this.store.select(selectOrders);

  ngOnInit(): void {
    this.store.dispatch(loadOrders());
  }

}
