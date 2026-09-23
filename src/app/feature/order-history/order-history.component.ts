import { Component, inject, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { selectOrders } from '../../store/orders/orders.selectors';
import { cancelOrder, loadOrders } from '../../store/orders/orders.action';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../shared/services/toast.service';
import { ConfirmDialogService } from '../../shared/services/confirm-dialog.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, FooterComponent],
  templateUrl: './order-history.component.html',
  styleUrl: './order-history.component.css'
})
export class OrderHistoryComponent implements OnInit {

  private store = inject(Store);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  orders$ = this.store.select(selectOrders);

  cancellingId: number | null = null;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.store.dispatch(loadOrders({ userId: user?.id }));
  }

  canCancel(status: string): boolean {
    return status === 'Placed' || status === 'Processing';
  }

  async cancel(orderId: number): Promise<void> {

    const confirmed = await this.confirmDialog.confirm({
      title: 'Cancel this order?',
      message: 'This will cancel your order. This action cannot be undone.',
      confirmText: 'Cancel Order',
      cancelText: 'Keep Order',
      danger: true
    });

    if (!confirmed) {
      return;
    }

    this.cancellingId = orderId;
    this.store.dispatch(cancelOrder({ orderId }));
    this.toast.success('Order cancelled successfully.');

    // Clear the local "in progress" flag shortly after dispatch; the store
    // update itself is reflected reactively via orders$.
    setTimeout(() => this.cancellingId = null, 400);
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
