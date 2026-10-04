
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';

import { Product } from '../../../core/Models/Product.model';
import { User } from '../../../core/Models/user.model';
import { Order } from '../../../core/Models/order.model';

type RevenueFilter =
  | 'Today'
  | 'Last 7 Days'
  | 'Last 30 Days'
  | 'Last 6 Months'
  | 'This Year';

interface SalesBook {
  title: string;
  quantity: number;
  revenue: number;
}

interface CategorySale {
  category: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

interface PaymentSummary {
  method: string;
  count: number;
  percentage: number;
}

interface RevenuePoint {
  label: string;
  value: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  private http = inject(HttpClient);
  private router = inject(Router);

  private usersUrl = 'http://localhost:3000/users';
  private productsUrl = 'http://localhost:3000/products';
  private ordersUrl = 'http://localhost:3000/orders';

  users: User[] = [];
  products: Product[] = [];
  orders: Order[] = [];

  loading = true;

  // --------------------------------------------------
  // SUMMARY
  // --------------------------------------------------

  totalUsers = 0;
  totalOrders = 0;
  totalProducts = 0;
  totalRevenue = 0;
  pendingOrders = 0;
  lowStockProducts = 0;

  activeUsers = 0;
  inactiveUsers = 0;

  inStockProducts = 0;
  outOfStockProducts = 0;

  // --------------------------------------------------
  // REVENUE GRAPH
  // --------------------------------------------------

  revenueFilter: RevenueFilter = 'Last 7 Days';

  revenuePoints: RevenuePoint[] = [];

  revenueChartPoints = '';
  revenueMax = 0;


  orderStatuses = [
    'Placed',
    'Processing',
    'Shipped',
    'Delivered',
    'Cancelled'
  ];

  orderStatusCounts: Record<string, number> = {
    Placed: 0,
    Processing: 0,
    Shipped: 0,
    Delivered: 0,
    Cancelled: 0
  };

  orderStatusMax = 1;

  
  recentOrders: Order[] = [];

  
  topSellingBooks: SalesBook[] = [];

  lowStockItems: Product[] = [];

  
  categories = [
    'Fiction',
    'Non Fiction',
    'Self Help',
    'Romance',
    'Children',
    'Classics'
  ];

  categorySales: CategorySale[] = [];

  
  paymentMethods: PaymentSummary[] = [];

 
  recentCustomers: User[] = [];

  
  ngOnInit(): void {
    this.loadDashboardData();
  }

  
  private loadDashboardData(): void {

    this.loading = true;

    this.http.get<User[]>(this.usersUrl).subscribe({
      next: users => {

        this.users = users;

        this.http.get<Product[]>(this.productsUrl).subscribe({
          next: products => {

            this.products = products;

            this.http.get<Order[]>(this.ordersUrl).subscribe({
              next: orders => {

                this.orders = orders;

                this.calculateDashboard();

                this.loading = false;
              },

              error: error => {
                console.error('Failed to load orders:', error);
                this.loading = false;
              }
            });
          },

          error: error => {
            console.error('Failed to load products:', error);
            this.loading = false;
          }
        });
      },

      error: error => {
        console.error('Failed to load users:', error);
        this.loading = false;
      }
    });
  }

  // --------------------------------------------------
  // MAIN CALCULATIONS
  // --------------------------------------------------

  private calculateDashboard(): void {

    this.totalUsers = this.users.length;

    this.totalProducts = this.products.length;

    this.totalOrders = this.orders.length;

    this.totalRevenue = this.orders
      .filter(order => this.getOrderStatus(order) !== 'Cancelled')
      .reduce(
        (total, order) => total + this.getOrderTotal(order),
        0
      );

    this.pendingOrders = this.orders.filter(order => {

      const status = this.getOrderStatus(order);

      return (
        status !== 'Delivered' &&
        status !== 'Cancelled'
      );

    }).length;

    this.lowStockProducts =
      this.products.filter(product =>
        Number(product.stock) > 0 &&
        Number(product.stock) <= 5
      ).length;

    this.activeUsers =
      this.users.filter(user => user.isActive !== false).length;

    this.inactiveUsers =
      this.users.filter(user => user.isActive === false).length;

    this.inStockProducts =
      this.products.filter(product =>
        Number(product.stock) > 5
      ).length;

    this.outOfStockProducts =
      this.products.filter(product =>
        Number(product.stock) <= 0
      ).length;

    this.calculateOrderStatuses();

    this.calculateRecentOrders();

    this.calculateLowStock();

    this.calculateTopSellingBooks();

    this.calculateCategorySales();

    this.calculatePaymentMethods();

    this.calculateRecentCustomers();

    this.calculateRevenueChart();
  }

  // --------------------------------------------------
  // ORDER TOTAL
  // --------------------------------------------------

  getOrderTotal(order: Order): number {

    const rawOrder = order as any;

    const total =
      rawOrder.total ??
      rawOrder.totalAmount ??
      0;

    return Number(total) || 0;
  }

  // --------------------------------------------------
  // ORDER STATUS
  // --------------------------------------------------

  getOrderStatus(order: Order): string {

    const rawOrder = order as any;

    return rawOrder.status || 'Placed';
  }

  // --------------------------------------------------
  // CUSTOMER NAME
  // --------------------------------------------------

  getUserName(userId?: number): string {

    if (userId === undefined || userId === null) {
      return 'Guest';
    }

    const user = this.users.find(
      item => String(item.id) === String(userId)
    );

    return user?.name || 'Unknown User';
  }

  // --------------------------------------------------
  // ORDER STATUSES
  // --------------------------------------------------

  private calculateOrderStatuses(): void {

    this.orderStatuses.forEach(status => {

      this.orderStatusCounts[status] =
        this.orders.filter(
          order => this.getOrderStatus(order) === status
        ).length;

    });

    this.orderStatusMax = Math.max(
      ...Object.values(this.orderStatusCounts),
      1
    );
  }

  // --------------------------------------------------
  // RECENT ORDERS
  // --------------------------------------------------

  private calculateRecentOrders(): void {

    this.recentOrders = [...this.orders]
      .sort((a, b) => {

        const dateA = this.getOrderDate(a).getTime();
        const dateB = this.getOrderDate(b).getTime();

        return dateB - dateA;
      })
      .slice(0, 5);
  }

  // --------------------------------------------------
  // LOW STOCK
  // --------------------------------------------------

  private calculateLowStock(): void {

    this.lowStockItems = [...this.products]
      .filter(product =>
        Number(product.stock) <= 5
      )
      .sort((a, b) =>
        Number(a.stock) - Number(b.stock)
      )
      .slice(0, 6);
  }

  // --------------------------------------------------
  // TOP SELLING BOOKS
  // --------------------------------------------------

  private calculateTopSellingBooks(): void {

    const salesMap = new Map<
      number | string,
      SalesBook
    >();

    this.orders
      .filter(order =>
        this.getOrderStatus(order) !== 'Cancelled'
      )
      .forEach(order => {

        const items = (order as any).items || [];

        items.forEach((item: any) => {

          const product = item.product;

          if (!product) {
            return;
          }

          const productId = product.id;

          const quantity =
            Number(item.quantity) || 0;

          const revenue =
            (Number(product.price) || 0) * quantity;

          const existing =
            salesMap.get(productId);

          if (existing) {

            existing.quantity += quantity;
            existing.revenue += revenue;

          } else {

            salesMap.set(productId, {
              title: product.title,
              quantity,
              revenue
            });

          }

        });

      });

    this.topSellingBooks =
      Array.from(salesMap.values())
        .sort((a, b) =>
          b.quantity - a.quantity
        )
        .slice(0, 5);
  }

  // --------------------------------------------------
  // CATEGORY SALES
  // --------------------------------------------------

  private calculateCategorySales(): void {

    const categoryMap = new Map<
      string,
      {
        quantity: number;
        revenue: number;
      }
    >();

    this.categories.forEach(category => {

      categoryMap.set(category, {
        quantity: 0,
        revenue: 0
      });

    });

    this.orders
      .filter(order =>
        this.getOrderStatus(order) !== 'Cancelled'
      )
      .forEach(order => {

        const items = (order as any).items || [];

        items.forEach((item: any) => {

          const product = item.product;

          if (!product) {
            return;
          }

          const category =
            product.category;

          if (!categoryMap.has(category)) {
            return;
          }

          const quantity =
            Number(item.quantity) || 0;

          const revenue =
            (Number(product.price) || 0) * quantity;

          const existing =
            categoryMap.get(category)!;

          existing.quantity += quantity;
          existing.revenue += revenue;

        });

      });

    const maxRevenue = Math.max(
      ...Array.from(categoryMap.values())
        .map(item => item.revenue),
      1
    );

    this.categorySales =
      Array.from(categoryMap.entries())
        .map(([category, value]) => ({
          category,
          quantity: value.quantity,
          revenue: value.revenue,
          percentage:
            (value.revenue / maxRevenue) * 100
        }))
        .sort((a, b) =>
          b.revenue - a.revenue
        );
  }

  // --------------------------------------------------
  // PAYMENT METHODS
  // --------------------------------------------------

  private calculatePaymentMethods(): void {

    const methods = [
      'COD',
      'Card',
      'UPI'
    ];

    const totalOrdersWithPayment =
      this.orders.length;

    this.paymentMethods =
      methods.map(method => {

        const count =
          this.orders.filter(order => {

            const rawOrder = order as any;

            return rawOrder.paymentMethod === method;

          }).length;

        return {
          method,
          count,
          percentage:
            totalOrdersWithPayment > 0
              ? (count / totalOrdersWithPayment) * 100
              : 0
        };

      });
  }

  // --------------------------------------------------
  // RECENT CUSTOMERS
  // --------------------------------------------------

  private calculateRecentCustomers(): void {

    /*
      Your current User model does not contain createdAt.

      Therefore we use the highest user IDs as the
      newest users. This works with the current
      JSON-server data structure.
    */

    this.recentCustomers =
      [...this.users]
        .filter(user => user.role !== 'admin')
        .sort((a, b) =>
          Number(b.id) - Number(a.id)
        )
        .slice(0, 5);
  }

  // --------------------------------------------------
  // REVENUE FILTER
  // --------------------------------------------------

  changeRevenueFilter(
    filter: RevenueFilter
  ): void {

    this.revenueFilter = filter;

    this.calculateRevenueChart();
  }

  // --------------------------------------------------
  // REVENUE CHART
  // --------------------------------------------------

  private calculateRevenueChart(): void {

    const now = new Date();

    const points: RevenuePoint[] = [];

    if (this.revenueFilter === 'Today') {

      for (let hour = 0; hour < 24; hour++) {

        const start =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hour
          );

        const end =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hour + 1
          );

        const value =
          this.getRevenueBetween(start, end);

        points.push({
          label:
            hour % 4 === 0
              ? `${hour}:00`
              : '',
          value
        });
      }

    } else if (
      this.revenueFilter === 'Last 7 Days'
    ) {

      for (let i = 6; i >= 0; i--) {

        const date = new Date(now);

        date.setDate(
          now.getDate() - i
        );

        const start =
          this.startOfDay(date);

        const end =
          this.endOfDay(date);

        points.push({
          label:
            date.toLocaleDateString(
              'en-IN',
              {
                day: 'numeric',
                month: 'short'
              }
            ),
          value:
            this.getRevenueBetween(
              start,
              end
            )
        });
      }

    } else if (
      this.revenueFilter === 'Last 30 Days'
    ) {

      for (let i = 29; i >= 0; i--) {

        const date = new Date(now);

        date.setDate(
          now.getDate() - i
        );

        const start =
          this.startOfDay(date);

        const end =
          this.endOfDay(date);

        points.push({
          label:
            i % 5 === 0
              ? date.toLocaleDateString(
                  'en-IN',
                  {
                    day: 'numeric',
                    month: 'short'
                  }
                )
              : '',
          value:
            this.getRevenueBetween(
              start,
              end
            )
        });
      }

    } else if (
      this.revenueFilter === 'Last 6 Months'
    ) {

      for (let i = 5; i >= 0; i--) {

        const date =
          new Date(
            now.getFullYear(),
            now.getMonth() - i,
            1
          );

        const start =
          new Date(
            date.getFullYear(),
            date.getMonth(),
            1
          );

        const end =
          new Date(
            date.getFullYear(),
            date.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          );

        points.push({
          label:
            date.toLocaleDateString(
              'en-IN',
              {
                month: 'short'
              }
            ),
          value:
            this.getRevenueBetween(
              start,
              end
            )
        });
      }

    } else {

      // This Year

      for (let month = 0; month <= now.getMonth(); month++) {

        const start =
          new Date(
            now.getFullYear(),
            month,
            1
          );

        const end =
          new Date(
            now.getFullYear(),
            month + 1,
            0,
            23,
            59,
            59,
            999
          );

        points.push({
          label:
            start.toLocaleDateString(
              'en-IN',
              {
                month: 'short'
              }
            ),
          value:
            this.getRevenueBetween(
              start,
              end
            )
        });
      }
    }

    this.revenuePoints = points;

    this.revenueMax =
      Math.max(
        ...points.map(point => point.value),
        1
      );

    this.createRevenueChartPoints();
  }

  // --------------------------------------------------
  // REVENUE CALCULATION
  // --------------------------------------------------

  private getRevenueBetween(
    start: Date,
    end: Date
  ): number {

    return this.orders
      .filter(order =>
        this.getOrderStatus(order) !== 'Cancelled'
      )
      .filter(order => {

        const date =
          this.getOrderDate(order);

        return (
          date >= start &&
          date <= end
        );
      })
      .reduce(
        (total, order) =>
          total + this.getOrderTotal(order),
        0
      );
  }

  // --------------------------------------------------
  // CREATE SVG LINE
  // --------------------------------------------------

  private createRevenueChartPoints(): void {

    if (this.revenuePoints.length === 0) {

      this.revenueChartPoints = '';

      return;
    }

    const width = 100;
    const height = 100;

    const count =
      this.revenuePoints.length;

    this.revenueChartPoints =
      this.revenuePoints
        .map((point, index) => {

          const x =
            count === 1
              ? 50
              : (index / (count - 1)) * width;

          const y =
            height -
            (
              point.value /
              this.revenueMax
            ) * 80 -
            10;

          return `${x},${y}`;

        })
        .join(' ');
  }

  // --------------------------------------------------
  // DATE HELPERS
  // --------------------------------------------------

   getOrderDate(
    order: Order
  ): Date {

    const rawOrder = order as any;

    const value =
      rawOrder.createdAt ??
      rawOrder.orderDate;

    if (!value) {
      return new Date(0);
    }

    const date =
      new Date(value);

    if (isNaN(date.getTime())) {
      return new Date(0);
    }

    return date;
  }

  private startOfDay(date: Date): Date {

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      0,
      0,
      0,
      0
    );
  }

  private endOfDay(date: Date): Date {

    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      23,
      59,
      59,
      999
    );
  }

  // --------------------------------------------------
  // STATUS CLASS
  // --------------------------------------------------

  getStatusClass(
    status: string
  ): string {

    switch (status) {

      case 'Delivered':
        return 'bg-green-50 text-green-700';

      case 'Shipped':
        return 'bg-blue-50 text-blue-700';

      case 'Processing':
        return 'bg-yellow-50 text-yellow-700';

      case 'Cancelled':
        return 'bg-red-50 text-red-700';

      default:
        return 'bg-gray-100 text-gray-700';
    }
  }

  // --------------------------------------------------
  // QUICK ACTIONS
  // --------------------------------------------------

  goToAddProduct(): void {
    this.router.navigate([
      '/admin/products'
    ], {
      queryParams: {
        action: 'add'
      }
    });
  }

  // --------------------------------------------------
  // CATEGORY BAR WIDTH
  // --------------------------------------------------

  getCategoryWidth(
    percentage: number
  ): number {

    return Math.max(
      percentage,
      3
    );
  }

  // --------------------------------------------------
  // TOP BOOK BAR WIDTH
  // --------------------------------------------------

  getBookWidth(
    quantity: number
  ): number {

    const max =
      Math.max(
        ...this.topSellingBooks
          .map(book => book.quantity),
        1
      );

    return Math.max(
      (quantity / max) * 100,
      5
    );
  }

  // --------------------------------------------------
  // ORDER STATUS BAR WIDTH
  // --------------------------------------------------

  getStatusWidth(
    count: number
  ): number {

    return Math.max(
      (count / this.orderStatusMax) * 100,
      count > 0 ? 5 : 0
    );
  }

  // --------------------------------------------------
  // PAYMENT WIDTH
  // --------------------------------------------------

  getPaymentWidth(
    percentage: number
  ): number {

    return Math.max(
      percentage,
      percentage > 0 ? 5 : 0
    );
  }
}

