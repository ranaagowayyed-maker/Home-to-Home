import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Role, ROLE_HOME, User } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { CartService } from '../../core/cart/cart.service';
import { NotificationBell } from './notification-bell';
import { Spinner } from './spinner';

interface NavLink {
  label: string;
  path: string;
  /** Only highlight on an exact URL match (a parent of another nav link). */
  exact?: boolean;
}

const ROLE_NAV: Record<Role, NavLink[]> = {
  CUSTOMER: [
    { label: 'Browse Meals', path: ROLE_HOME.CUSTOMER },
    { label: 'My Orders', path: '/orders', exact: true },
  ],
  MOTHER: [
    { label: 'My Meals', path: ROLE_HOME.MOTHER },
    { label: 'Incoming Orders', path: '/incoming-orders' },
    { label: 'Order History', path: '/orders', exact: true },
  ],
  DELIVERY: [
    { label: 'Available Deliveries', path: ROLE_HOME.DELIVERY, exact: true },
    { label: 'My Deliveries', path: '/deliveries/mine' },
    { label: 'Order History', path: '/orders', exact: true },
  ],
};

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, NotificationBell, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sticky top-0 z-40 block border-b border-stone-200 bg-white/95 backdrop-blur',
    '(document:click)': 'closeMenus()',
    '(document:keydown.escape)': 'closeMenus()',
  },
  template: `
    <div class="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4">
      <a [routerLink]="home()" class="mr-auto flex min-h-11 items-center font-bold text-brand-700">
        From Home To Home
      </a>
      <nav aria-label="Main" class="hidden sm:block">
        @for (link of nav(); track link.path) {
          <a
            [routerLink]="link.path"
            routerLinkActive="bg-brand-50 text-brand-800"
            [routerLinkActiveOptions]="{ exact: !!link.exact }"
            class="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            {{ link.label }}
          </a>
        }
      </nav>
      <app-notification-bell [open]="bellOpen()" (openChange)="setBellOpen($event)" />
      @if (user().role === 'CUSTOMER') {
        <a
          routerLink="/cart"
          class="relative inline-flex size-11 items-center justify-center rounded-lg text-stone-700 hover:bg-stone-100"
          [attr.aria-label]="cartLabel()"
        >
          <svg
            class="size-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.8h7.7a2 2 0 0 0 2-1.6L21 8H6"
            />
            <circle cx="10" cy="20.5" r="1" />
            <circle cx="17" cy="20.5" r="1" />
          </svg>
          @if (cart.count() > 0) {
            <span
              class="absolute top-0.5 right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-700 px-1 text-xs font-bold text-white"
              data-testid="cart-badge"
            >
              {{ cart.count() }}
            </span>
          }
        </a>
      }
      <div class="relative">
        <button
          type="button"
          class="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium hover:bg-stone-100"
          aria-haspopup="menu"
          [attr.aria-expanded]="menuOpen()"
          (click)="toggleMenu($event)"
        >
          <span
            class="flex size-8 items-center justify-center rounded-full bg-brand-100 text-brand-800"
          >
            {{ initial() }}
          </span>
          <span class="hidden max-w-32 truncate sm:inline">{{ user().name }}</span>
        </button>
        @if (menuOpen()) {
          <div
            role="menu"
            tabindex="-1"
            class="absolute right-0 mt-2 w-56 rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
            (click)="$event.stopPropagation()"
            (keydown)="$event.stopPropagation()"
          >
            <p class="truncate px-4 py-2 text-xs text-stone-500">{{ user().email }}</p>
            @for (link of nav(); track link.path) {
              <a
                role="menuitem"
                [routerLink]="link.path"
                class="flex min-h-11 items-center px-4 text-sm hover:bg-stone-100 sm:hidden"
                (click)="menuOpen.set(false)"
              >
                {{ link.label }}
              </a>
            }
            <a
              role="menuitem"
              routerLink="/profile"
              class="flex min-h-11 items-center px-4 text-sm hover:bg-stone-100"
              (click)="menuOpen.set(false)"
            >
              Profile
            </a>
            <button
              type="button"
              role="menuitem"
              class="flex min-h-11 w-full items-center gap-2 px-4 text-left text-sm text-red-700 hover:bg-stone-100 disabled:opacity-60"
              [disabled]="loggingOut()"
              (click)="logout()"
            >
              @if (loggingOut()) {
                <app-spinner />
              }
              Log out
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class AppHeader {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly cart = inject(CartService);

  readonly user = input.required<User>();

  protected readonly menuOpen = signal(false);
  protected readonly bellOpen = signal(false);
  protected readonly loggingOut = signal(false);
  protected readonly nav = computed(() => ROLE_NAV[this.user().role]);
  protected readonly home = computed(() => ROLE_HOME[this.user().role]);
  protected readonly cartLabel = computed(() => {
    const count = this.cart.count();
    return count === 0 ? 'Cart, empty' : `Cart, ${count} ${count === 1 ? 'item' : 'items'}`;
  });
  protected readonly initial = computed(() => this.user().name.charAt(0).toUpperCase());

  protected toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.bellOpen.set(false);
    this.menuOpen.update((open) => !open);
  }

  protected setBellOpen(open: boolean): void {
    this.bellOpen.set(open);
    if (open) {
      this.menuOpen.set(false);
    }
  }

  protected closeMenus(): void {
    this.menuOpen.set(false);
    this.bellOpen.set(false);
  }

  protected logout(): void {
    this.loggingOut.set(true);
    this.auth.logout().subscribe(() => {
      // The cart lives in this browser; do not hand it to the next person who logs in here.
      this.cart.clear();
      this.loggingOut.set(false);
      this.menuOpen.set(false);
      void this.router.navigateByUrl('/');
    });
  }
}
