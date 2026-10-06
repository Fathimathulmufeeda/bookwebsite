import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';

import { User } from '../../../core/Models/user.model';
import { Order } from '../../../core/Models/order.model';

import { ConfirmDialogService } from '../../../shared/services/confirm-dialog.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PaginationComponent, paginate } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PaginationComponent
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {

  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  users: User[] = [];
  orders: Order[] = [];

  loading = false;
  error = '';

  searchTerm = '';

  // Pagination
  page = 1;
  pageSize = 10;

  selectedUser: User | null = null;

  ngOnInit(): void {
    this.loadUsers();
  }

  // Load users and orders
  loadUsers(): void {
    this.loading = true;
    this.error = '';

    this.authService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.clampPage();
        this.loadOrders();
      },

      error: () => {
        this.error = 'Unable to load users.';
        this.loading = false;
      }
    });
  }

  // Load all orders
  loadOrders(): void {

    this.orderService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.loading = false;
      },

      error: () => {
        this.error = 'Unable to load orders.';
        this.loading = false;
      }
    });
  }

  // Search users
  get filteredUsers(): User[] {

    const search = this.searchTerm
      .trim()
      .toLowerCase();

    if (!search) {
      return this.users;
    }

    return this.users.filter(user =>
      user.name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.role.toLowerCase().includes(search)
    );
  }

  // Only the users for the current page (after search)
  get pagedUsers(): User[] {
    return paginate(this.filteredUsers, this.page, this.pageSize).items;
  }

  // If the list shrinks and the current page no longer exists,
  // move back to the last available page.
  private clampPage(): void {
    const totalPages = Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));

    if (this.page > totalPages) {
      this.page = totalPages;
    }
  }

  // Check user status
  isActive(user: User): boolean {
    return user.isActive !== false;
  }

  // Activate / Deactivate user
  async toggleUserStatus(user: User): Promise<void> {

    const currentlyActive = this.isActive(user);
    const newStatus = !currentlyActive;

    const confirmed = await this.confirmDialog.confirm({

      title: newStatus
        ? 'Activate User'
        : 'Deactivate User',

      message: newStatus
        ? `Are you sure you want to activate ${user.name}?`
        : `Are you sure you want to deactivate ${user.name}?`,

      confirmText: newStatus
        ? 'Activate'
        : 'Deactivate',

      cancelText: 'Cancel',

      danger: !newStatus
    });

    if (!confirmed) {
      return;
    }

    this.authService
      .setActive(user.id, newStatus)
      .subscribe({

        next: () => {
          user.isActive = newStatus;
          this.toast.success(`${user.name} has been ${newStatus ? 'activated' : 'deactivated'}.`);
        },

        error: () => {
          this.error = 'Unable to update user status.';
          this.toast.error('Unable to update user status. Please try again.');
        }

      });
  }

  // View user
  viewUser(user: User): void {
    this.selectedUser = user;
  }

  // Close user view
  closeView(): void {
    this.selectedUser = null;
  }

  // Get selected user's orders
  get selectedUserOrders(): Order[] {

    if (!this.selectedUser) {
      return [];
    }

    return this.orders
      .filter(order =>
        String(order.userId) ===
        String(this.selectedUser!.id)
      )
      .sort((a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime()
      );
  }

  // Total amount spent by selected user
  get totalSpent(): number {
    return this.selectedUserOrders
      .filter(order => order.status !== 'Cancelled')
      .reduce(
        (total, order) => total + Number(order.total || 0),
        0
      );
  }

  // Number of orders
  getOrderCount(user: User): number {

    return this.orders.filter(order =>
      String(order.userId) ===
      String(user.id)
    ).length;
  }

  // Order status styling
  getStatusClass(status: string): string {

    switch (status) {

      case 'Delivered':
        return 'bg-green-100 text-green-700';

      case 'Shipped':
        return 'bg-blue-100 text-blue-700';

      case 'Cancelled':
        return 'bg-red-100 text-red-700';

      case 'Processing':
        return 'bg-purple-100 text-purple-700';

      case 'Placed':
        return 'bg-amber-100 text-amber-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  }
}