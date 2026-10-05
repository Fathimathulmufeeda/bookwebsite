import { Component, EventEmitter, Input, Output } from '@angular/core';

// ===========================================================
// Helper: slices any list for the requested page.
// The page number is clamped, so it is always valid even if the
// list shrinks (after a search, filter or delete).
// ===========================================================

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export function paginate<T>(items: T[], page: number, pageSize: number): PageResult<T> {

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    totalItems,
    totalPages
  };
}

// ===========================================================
// Component: <app-pagination> UI
// ===========================================================

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (totalItems > 0) {
    <div class="flex flex-col items-center gap-3 border-t border-gray-100 px-5 py-5">

      @if (totalPages > 1) {
      <div class="flex flex-wrap items-center justify-center gap-1">

        <button type="button" (click)="go(currentPage - 1)" [disabled]="currentPage === 1"
          class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-[#193629] hover:text-[#193629] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600">
          Prev
        </button>

        @for (p of pages; track $index) {
          @if (p === '...') {
          <span class="px-2 text-xs text-gray-400">…</span>
          } @else {
          <button type="button" (click)="go(+p)"
            class="min-w-8 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition"
            [class]="p === currentPage
              ? 'border-[#193629] bg-[#193629] text-white'
              : 'border-gray-200 bg-white text-gray-600 hover:border-[#193629] hover:text-[#193629]'">
            {{ p }}
          </button>
          }
        }

        <button type="button" (click)="go(currentPage + 1)" [disabled]="currentPage === totalPages"
          class="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-[#193629] hover:text-[#193629] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-600">
          Next
        </button>

      </div>
      }

      <p class="text-center text-xs text-gray-500">
        Showing <span class="font-medium text-gray-700">{{ from }}–{{ to }}</span>
        of <span class="font-medium text-gray-700">{{ totalItems }}</span>
      </p>

    </div>
    }
  `
})
export class PaginationComponent {

  @Input() currentPage = 1;
  @Input() totalItems = 0;
  @Input() pageSize = 10;

  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems / this.pageSize));
  }

  get from(): number {
    return this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get to(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  // Example: 1 … 4 5 6 … 12
  get pages(): (number | '...')[] {

    const total = this.totalPages;
    const current = this.currentPage;

    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const result: (number | '...')[] = [1];

    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);

    if (start > 2) {
      result.push('...');
    }

    for (let i = start; i <= end; i++) {
      result.push(i);
    }

    if (end < total - 1) {
      result.push('...');
    }

    result.push(total);

    return result;
  }

  go(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    this.pageChange.emit(page);
  }
}