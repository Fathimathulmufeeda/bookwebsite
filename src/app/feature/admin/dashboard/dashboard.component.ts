import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import Chart from 'chart.js/auto';

import { ProductService } from '../../../core/services/product.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { normalizeCategory } from '../../../shared/utils/category.util';

import { Order, OrderStatus, PaymentMethod } from '../../../core/Models/order.model';
import { User } from '../../../core/Models/user.model';
import { Product } from '../../../core/Models/Product.model';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  activeUsers: number;
  pendingOrdersCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {

  private productService = inject(ProductService);
  private orderService = inject(OrderService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  // The canvases live inside an @if (!loading && stats) block in the template,
  // so these refs only exist after Angular has rendered that block.
  // We call cdr.detectChanges() before drawing to guarantee they are resolved.
  @ViewChild('revenueChart') revenueChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('paymentChart') paymentChartRef?: ElementRef<HTMLCanvasElement>;

  private revenueChartInstance?: Chart;
  private statusChartInstance?: Chart;
  private categoryChartInstance?: Chart;
  private paymentChartInstance?: Chart;

  // A book with stock from 1 up to this number counts as "low stock".
  private readonly LOW_STOCK_THRESHOLD = 5;

  loading = true;
  error = '';

  stats: DashboardStats | null = null;
  recentOrders: Order[] = [];

  private allOrders: Order[] = [];
  private allProducts: Product[] = [];
  private usersById = new Map<number, User>();

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.revenueChartInstance?.destroy();
    this.statusChartInstance?.destroy();
    this.categoryChartInstance?.destroy();
    this.paymentChartInstance?.destroy();
  }

  loadDashboard(): void {

    this.loading = true;
    this.error = '';

    forkJoin({
      products: this.productService.getProducts(),
      orders: this.orderService.getOrders(),
      users: this.authService.getUsers()
    }).subscribe({

      next: ({ products, orders, users }) => {

        this.allOrders = orders;
        this.allProducts = products;
        this.usersById = new Map(users.map(u => [u.id, u]));

        const revenue = orders
          .filter(o => o.status !== 'Cancelled')
          .reduce((sum, o) => sum + Number(o.total || 0), 0);

        this.stats = {
          totalRevenue: revenue,
          totalOrders: orders.length,
          totalProducts: products.length,
          totalUsers: users.length,
          activeUsers: users.filter(u => u.isActive !== false).length,
          pendingOrdersCount: orders.filter(o => o.status === 'Placed' || o.status === 'Processing').length,
          lowStockCount: products.filter(p => p.stock > 0 && p.stock <= this.LOW_STOCK_THRESHOLD).length,
          outOfStockCount: products.filter(p => p.stock <= 0).length
        };

        this.recentOrders = [...orders]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        this.loading = false;

        // Render the @if block now so the <canvas> elements exist
        // and the @ViewChild refs are resolved, then draw the charts.
        this.cdr.detectChanges();
        this.renderAllCharts();
      },

      error: () => {
        this.error = 'Unable to load dashboard data.';
        this.loading = false;
      }

    });
  }

  // ===========================================================
  // Derived lists (plain getters — cheap, no chart involved)
  // ===========================================================

  get topSellingBooks(): { title: string; sold: number }[] {

    const totals = new Map<number, { title: string; sold: number }>();

    this.allOrders
      .filter(o => o.status !== 'Cancelled')
      .forEach(order => {
        order.items.forEach(item => {

          const existing = totals.get(item.product.id);

          if (existing) {
            existing.sold += item.quantity;
          } else {
            totals.set(item.product.id, { title: item.product.title, sold: item.quantity });
          }
        });
      });

    return [...totals.values()]
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 5);
  }

  get lowStockProducts(): Product[] {
    return this.allProducts
      .filter(p => p.stock <= this.LOW_STOCK_THRESHOLD)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
  }


  // ===========================================================
  // Charts
  // ===========================================================

  private renderAllCharts(): void {
    this.renderRevenueChart();
    this.renderStatusChart();
    this.renderCategoryChart();
    this.renderPaymentChart();
  }

  private computeRevenueByDay(): { labels: string[]; data: number[] } {

    const days: { dateKey: string; label: string }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        dateKey: d.toDateString(),
        label: d.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }

    const data = days.map(({ dateKey }) =>
      this.allOrders
        .filter(o => o.status !== 'Cancelled' && new Date(o.createdAt).toDateString() === dateKey)
        .reduce((sum, o) => sum + Number(o.total || 0), 0)
    );

    return { labels: days.map(d => d.label), data };
  }

  private renderRevenueChart(): void {

    if (!this.revenueChartRef) {
      return;
    }

    const { labels, data } = this.computeRevenueByDay();

    this.revenueChartInstance?.destroy();

    this.revenueChartInstance = new Chart(this.revenueChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue',
          data,
          borderColor: '#193629',
          backgroundColor: 'rgba(25, 54, 41, 0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: '#193629'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => `₹${ctx.parsed.y ?? 0}` } }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: (value) => `₹${value}` }
          }
        }
      }
    });
  }

  private computeStatusCounts(): { labels: OrderStatus[]; data: number[] } {

    const statuses: OrderStatus[] = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    const data = statuses.map(
      status => this.allOrders.filter(o => o.status === status).length
    );

    return { labels: statuses, data };
  }

  private renderStatusChart(): void {

    if (!this.statusChartRef) {
      return;
    }

    const { labels, data } = this.computeStatusCounts();

    this.statusChartInstance?.destroy();

    this.statusChartInstance = new Chart(this.statusChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Orders',
          data,
          backgroundColor: ['#f59e0b', '#a855f7', '#3b82f6', '#22c55e', '#ef4444'],
          borderRadius: 6,
          maxBarThickness: 40
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  private computeCategorySales(): { labels: string[]; data: number[] } {

    const totals = new Map<string, number>();
    const displayLabels = new Map<string, string>();

    this.allOrders
      .filter(o => o.status !== 'Cancelled')
      .forEach(order => {
        order.items.forEach(item => {

          const original = item.product.category || 'Uncategorized';
          const key = normalizeCategory(original);

          totals.set(key, (totals.get(key) ?? 0) + item.quantity);

          if (!displayLabels.has(key)) {
            displayLabels.set(key, original);
          }
        });
      });

    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);

    return {
      labels: sorted.map(([key]) => displayLabels.get(key) ?? key),
      data: sorted.map(([, value]) => value)
    };
  }

  private renderCategoryChart(): void {

    if (!this.categoryChartRef) {
      return;
    }

    const { labels, data } = this.computeCategorySales();

    this.categoryChartInstance?.destroy();

    this.categoryChartInstance = new Chart(this.categoryChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Units sold',
          data,
          backgroundColor: '#193629',
          borderRadius: 6
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  private computePaymentBreakdown(): { labels: PaymentMethod[]; data: number[] } {

    const methods: PaymentMethod[] = ['COD', 'Card', 'UPI'];

    const data = methods.map(
      method => this.allOrders.filter(o => o.paymentMethod === method).length
    );

    return { labels: methods, data };
  }

  private renderPaymentChart(): void {

    if (!this.paymentChartRef) {
      return;
    }

    const { labels, data } = this.computePaymentBreakdown();

    this.paymentChartInstance?.destroy();

    // If nobody has placed an order with a recorded payment method yet,
    // skip rendering rather than showing an empty/misleading ring.
    if (data.every(count => count === 0)) {
      return;
    }

    this.paymentChartInstance = new Chart(this.paymentChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#193629', '#a17b19', '#2a4d8f']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
        }
      }
    });
  }

  // ===========================================================
  // Display helpers (shared with Orders/Users admin pages' style)
  // ===========================================================

  getUserName(userId: number | undefined): string {

    if (userId == null) {
      return 'Guest';
    }

    const user = this.usersById.get(userId);

    return user ? user.name : `User #${userId}`;
  }

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