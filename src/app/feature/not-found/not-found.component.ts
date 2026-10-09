import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-[#f8f5ef] px-4 py-10">

      <div class="w-full max-w-lg rounded-md border border-[#ebe6dd] bg-white p-8 text-center shadow-sm sm:p-12">

        <!-- Brand -->
        <div class="mb-8 flex items-center justify-center gap-2 text-[#26332b]">

          <svg class="h-8 w-6 text-[#867354]" viewBox="0 0 32 40" fill="none">
            <path d="M4 6h9c4 0 7 2 7 5v25c-2-2-4-3-7-3H4V6Z" stroke="currentColor" stroke-width="1.3" />
            <path d="M28 6h-9c-4 0-7 2-7 5v25c2-2 4-3 7-3h9V6Z" stroke="currentColor" stroke-width="1.3" />
            <path d="M16 8v25" stroke="currentColor" stroke-width="1.3" />
          </svg>

          <div class="text-left">
            <h1 class="font-serif text-lg font-medium tracking-[0.18em]">NOVA</h1>
            <p class="mt-0.5 text-[7px] tracking-[0.32em]">BOOKSHOP</p>
          </div>

        </div>

        <!-- 404 -->
        <p class="font-serif text-7xl font-medium text-[#193629] sm:text-8xl">404</p>

        <h2 class="mt-4 font-serif text-2xl font-medium text-[#202a24]">
          Page not found
        </h2>

        <p class="mt-3 text-sm leading-6 text-[#777d76]">
          The page you are looking for doesn't exist, was moved, or the link is incorrect.
        </p>

        <!-- Action -->
        <div class="mt-8 flex justify-center">

          <a [routerLink]="homeLink"
            class="inline-block rounded-sm bg-[#193629] px-8 py-3 text-xs font-bold uppercase tracking-[0.15em] text-white no-underline transition hover:bg-[#28503b]">
            {{ homeLabel }}
          </a>

        </div>

      </div>

    </div>
  `
})
export class NotFoundComponent {

  private authService = inject(AuthService);

  // Admins go back to their dashboard, everyone else to the storefront
  private get isAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'admin';
  }

  get homeLink(): string {
    return this.isAdmin ? '/admin' : '/home';
  }

  get homeLabel(): string {
    return this.isAdmin ? 'Back to Dashboard' : 'Back to Home';
  }

}