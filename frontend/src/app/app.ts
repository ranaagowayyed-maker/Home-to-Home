import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/auth/auth.service';
import { AppHeader } from './shared/ui/app-header';
import { ToastContainer } from './shared/ui/toast-container';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AppHeader, ToastContainer],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (auth.currentUser(); as user) {
      <app-header [user]="user" />
    }
    <main class="mx-auto w-full max-w-3xl px-4 pt-6 pb-16">
      <router-outlet />
    </main>
    <app-toast-container />
  `,
})
export class App {
  protected readonly auth = inject(AuthService);
}
