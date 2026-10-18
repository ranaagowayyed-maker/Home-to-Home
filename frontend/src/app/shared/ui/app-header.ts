import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Role, ROLE_HOME, User } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { Spinner } from './spinner';

interface NavLink {
  label: string;
  path: string;
}

const ROLE_NAV: Record<Role, NavLink[]> = {
  CUSTOMER: [{ label: 'Browse Meals', path: ROLE_HOME.CUSTOMER }],
  MOTHER: [{ label: 'My Meals', path: ROLE_HOME.MOTHER }],
  DELIVERY: [{ label: 'Available Deliveries', path: ROLE_HOME.DELIVERY }],
};

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, Spinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'sticky top-0 z-40 block border-b border-stone-200 bg-white/95 backdrop-blur',
    '(document:click)': 'menuOpen.set(false)',
    '(document:keydown.escape)': 'menuOpen.set(false)',
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
            class="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-stone-700 hover:bg-stone-100"
          >
            {{ link.label }}
          </a>
        }
      </nav>
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

  readonly user = input.required<User>();

  protected readonly menuOpen = signal(false);
  protected readonly loggingOut = signal(false);
  protected readonly nav = computed(() => ROLE_NAV[this.user().role]);
  protected readonly home = computed(() => ROLE_HOME[this.user().role]);
  protected readonly initial = computed(() => this.user().name.charAt(0).toUpperCase());

  protected toggleMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.menuOpen.update((open) => !open);
  }

  protected logout(): void {
    this.loggingOut.set(true);
    this.auth.logout().subscribe(() => {
      this.loggingOut.set(false);
      this.menuOpen.set(false);
      void this.router.navigateByUrl('/');
    });
  }
}
