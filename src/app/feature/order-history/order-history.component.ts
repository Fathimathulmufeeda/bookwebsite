import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { selectOrders } from '../../store/orders/orders.selectors';
import { cancelOrder, loadOrders } from '../../store/orders/orders.action';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { Order, OrderStatus } from '../../core/Models/order.model';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {

  private store = inject(Store);
  private authService = inject(AuthService);
  private toast = inject(ToastService);

  orders$ = this.store.select(selectOrders);

  
  selectedOrder: Order | null = null;


  cancelTarget: Order | null = null;
  cancelReason = '';
  cancelError = '';
  cancelling = false;
  
  // Pagination
currentPage = 1;
readonly pageSize = 5;

getPageNumbers(totalOrders: number): number[] {
  const totalPages = Math.ceil(totalOrders / this.pageSize);

  return Array.from(
    { length: totalPages },
    (_, index) => index + 1
  );
}

changePage(page: number, totalOrders: number): void {
  const totalPages = Math.ceil(totalOrders / this.pageSize);

  if (page >= 1 && page <= totalPages) {
    this.currentPage = page;
  }
}

  readonly cancelPresets: string[] = [
    'Ordered by mistake',
    'Found a better price elsewhere',
    'Taking too long to arrive',
    'Changed my mind'
  ];

  readonly trackingStatuses: OrderStatus[] = ['Placed', 'Processing', 'Shipped', 'Delivered'];

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
  
    // Load the current user's orders
    this.store.dispatch(
      loadOrders({ userId: user?.id })
    );
  
    this.orders$.subscribe(orders => {
      const totalPages = Math.ceil(orders.length / this.pageSize);
  
      if (totalPages === 0) {
        this.currentPage = 1;
      } else if (this.currentPage > totalPages) {
        this.currentPage = totalPages;
      }
  
      // Keep the selected order updated
      if (this.selectedOrder) {
        const updated = orders.find(
          order => order.id === this.selectedOrder!.id
        );
  
        if (updated) {
          this.selectedOrder = updated;
        }
      }
    });
  }
  canCancel(status: string): boolean {
    return status === 'Placed' || status === 'Processing';
  }

  viewOrder(order: Order): void {
    this.selectedOrder = order;
  }

  closeView(): void {
    this.selectedOrder = null;
  }

  openCancelDialog(order: Order, event?: Event): void {
    event?.stopPropagation();
    this.cancelTarget = order;
    this.cancelReason = '';
    this.cancelError = '';
    this.cancelling = false;
  }

  closeCancelDialog(): void {
    this.cancelTarget = null;
    this.cancelReason = '';
    this.cancelError = '';
    this.cancelling = false;
  }

  usePreset(reason: string): void {
    this.cancelReason = reason;
    this.cancelError = '';
  }

  confirmCancel(): void {

    const order = this.cancelTarget;

    if (!order) {
      return;
    }

    const reason = this.cancelReason.trim();

    if (reason.length < 5) {
      this.cancelError = 'Please let us know why (at least 5 characters).';
      return;
    }

    if (reason.length > 200) {
      this.cancelError = 'The reason cannot exceed 200 characters.';
      return;
    }

    this.cancelling = true;
    this.cancelError = '';

    this.store.dispatch(cancelOrder({ orderId: order.id, reason }));
    this.toast.success('Your order has been cancelled.');

    this.closeCancelDialog();
  }

  getTrackingSteps(order: Order): { label: string; state: 'done' | 'current' | 'upcoming' }[] {

    const currentIndex = this.trackingStatuses.indexOf(order.status as OrderStatus);

    return this.trackingStatuses.map((label, index) => ({
      label,
      state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming'
    }));
  }

  statusClasses(status: string): string {
    switch (status) {
      case 'Delivered': return 'bg-[#e7f3ea] text-[#1c7a3b]';
      case 'Cancelled': return 'bg-red-50 text-red-600';
      case 'Shipped': return 'bg-[#e8eefb] text-[#2a4d8f]';
      case 'Processing': return 'bg-[#faf1da] text-[#a17b19]';
      default: return 'bg-[#f0ece3] text-[#5c645d]';
    }
  }
}