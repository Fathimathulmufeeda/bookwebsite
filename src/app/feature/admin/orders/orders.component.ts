import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus } from '../../../core/Models/order.model';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/Models/user.model';
import { PaginationComponent, paginate } from '../../../shared/components/pagination/pagination.component';
import { ToastService } from '../../../shared/services/toast.service';
import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';

// Orders can carry the reason the admin gave when cancelling them
type OrderWithReason = Order & { cancellationReason?: string; cancelledAt?: string };

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css'
})
export class OrdersComponent implements OnInit {

  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  orders: Order[] = [];
  private usersById = new Map<number, User>();

  loading = false;
  error = '';

  searchTerm = '';
  selectedStatus = 'All';

  // Pagination
  page = 1;
  pageSize = 10;

  selectedOrder: Order | null = null;

  // Cancel dialog (the admin must give a reason)
  cancelTarget: Order | null = null;
  cancelReason = '';
  cancelError = '';
  cancelling = false;

  readonly cancelPresets: string[] = [
    'Item is out of stock',
    'Payment issue',
    'Delivery not available for your address',
    'Cancelled at your request'
  ];

  statuses: OrderStatus[] = [
    'Placed',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled'
  ];

  ngOnInit(): void {
    this.loadUsers();
    this.loadOrders();
  }

  private loadUsers(): void {
    this.authService.getUsers().subscribe({
      next: (users) => {
        this.usersById = new Map(users.map(u => [u.id, u]));
      },
      error: () => {
        // Non-fatal — orders still load, names just fall back to "User #id".
      }
    });
  }

  getUserName(userId: number | undefined): string {

    if (userId == null) {
      return 'Guest';
    }

    const user = this.usersById.get(userId);

    return user ? user.name : `User #${userId}`;
  }

  loadOrders(): void {

    this.loading = true;
    this.error = '';

    this.orderService.getOrders().subscribe({

      next: (orders) => {
        this.orders = orders;
        this.clampPage();
        this.loading = false;
      },

      error: () => {
        this.error = 'Unable to load orders.';
        this.loading = false;
      }

    });
  }

  get filteredOrders(): Order[] {

    const search = this.searchTerm
      .trim()
      .toLowerCase();

    return this.orders.filter(order => {

      const matchesSearch =
        !search ||
        String(order.id).includes(search) ||
        String(order.userId ?? '').includes(search) ||
        this.getUserName(order.userId).toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'All' ||
        order.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  // Only the orders for the current page (after search + status filter)
  get pagedOrders(): Order[] {
    return paginate(this.filteredOrders, this.page, this.pageSize).items;
  }

  // If the list shrinks (filter, status change) and the current page
  // no longer exists, move back to the last available page.
  private clampPage(): void {
    const totalPages = Math.max(1, Math.ceil(this.filteredOrders.length / this.pageSize));

    if (this.page > totalPages) {
      this.page = totalPages;
    }
  }

  getStatusClass(status: OrderStatus): string {

    switch (status) {

      case 'Placed':
        return 'bg-amber-100 text-amber-700';

      case 'Processing':
        return 'bg-purple-100 text-purple-700';

      case 'Shipped':
        return 'bg-blue-100 text-blue-700';

      case 'Delivered':
        return 'bg-green-100 text-green-700';

      case 'Cancelled':
        return 'bg-red-100 text-red-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  viewOrder(order: Order): void {
    this.selectedOrder = order;
  }

  closeView(): void {
    this.selectedOrder = null;
  }

  async onStatusChange(order: Order, status: OrderStatus, select: HTMLSelectElement): Promise<void> {

    const previousStatus = order.status;

    // Selecting the current status again does nothing
    if (status === previousStatus) {
      return;
    }

    // Put the dropdown back to the real status until the admin confirms.
    // After a successful save, the dropdown updates to the new status.
    select.value = previousStatus;

    if (status === 'Cancelled') {
      this.openCancelDialog(order);
      return;
    }

    const confirmed = await this.confirmDialog.confirm({
      title: 'Update order status',
      message:
        `Change Order #${order.id} from "${previousStatus}" to "${status}"? ` +
        `Order statuses can only move forward, so this cannot be changed back.`,
      confirmText: `Mark as ${status}`,
      cancelText: 'Cancel'
    });

    if (!confirmed) {
      return;
    }

    this.updateStatus(order, status);
  }

  openCancelDialog(order: Order): void {
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

  // Quick-fill buttons in the cancel dialog
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
      this.cancelError = 'Please enter a reason (at least 5 characters).';
      return;
    }

    if (reason.length > 200) {
      this.cancelError = 'The reason cannot exceed 200 characters.';
      return;
    }

    this.cancelling = true;
    this.cancelError = '';

    this.orderService
      .updateOrderStatus(order.id, 'Cancelled', reason)
      .subscribe({

        next: (updatedOrder) => {

          const saved = updatedOrder as OrderWithReason;
          const target = order as OrderWithReason;

          target.status = updatedOrder.status;
          target.cancellationReason = saved.cancellationReason ?? reason;
          target.cancelledAt = saved.cancelledAt ?? new Date().toISOString();

          this.closeCancelDialog();
          this.toast.success(`Order #${order.id} cancelled. The customer can see the reason.`);
          this.clampPage();
        },

        error: () => {
          this.cancelling = false;
          this.cancelError = 'Unable to cancel the order. Please try again.';
          this.toast.error('Unable to cancel the order. Please try again.');
        }

      });
  }

  getCancellationReason(order: Order): string {
    return (order as OrderWithReason).cancellationReason ?? '';
  }

  // Order of progress. A status can only move forward, never back.
  private readonly statusFlow: OrderStatus[] = [
    'Placed',
    'Processing',
    'Shipped',
    'Delivered'
  ];

  // Returns true when `option` must not be selectable for an order
  // that is currently `current`.
  isStatusDisabled(current: OrderStatus, option: OrderStatus): boolean {

    // The current status itself always stays selectable (it is the selected value)
    if (option === current) {
      return false;
    }

    if (current === 'Cancelled') {
      return true;
    }


    if (option === 'Cancelled') {
      return current === 'Shipped' || current === 'Delivered';
    }

    return this.statusFlow.indexOf(option) < this.statusFlow.indexOf(current);
  }

  updateStatus(order: Order, status: OrderStatus): void {

    if (this.isStatusDisabled(order.status, status)) {
      return;
    }


    if (status === 'Cancelled') {
      this.openCancelDialog(order);
      return;
    }

    this.orderService
      .updateOrderStatus(order.id, status)
      .subscribe({
  
        next: (updatedOrder) => {
          order.status = updatedOrder.status;
          this.toast.success(`Order #${order.id} marked as ${updatedOrder.status}.`);
          this.clampPage();
        },
  
        error: () => {
          this.error = 'Unable to update order status.';
          this.toast.error('Unable to update the order status. Please try again.');
        }
  
      });
  }
}