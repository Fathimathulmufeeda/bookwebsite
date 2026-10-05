import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { OrderService } from '../../../core/services/order.service';
import { Order, OrderStatus } from '../../../core/Models/order.model';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../core/Models/user.model';
import { PaginationComponent, paginate } from '../../../shared/components/pagination/pagination.component';

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

  updateStatus(order: Order, status: OrderStatus): void {

    this.orderService
      .updateOrderStatus(order.id, status)
      .subscribe({
  
        next: (updatedOrder) => {
          order.status = updatedOrder.status;
          this.clampPage();
        },
  
        error: () => {
          this.error = 'Unable to update order status.';
        }
  
      });
  }
}