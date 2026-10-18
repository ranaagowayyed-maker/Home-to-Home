import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { apiUrl } from '../api/api-url';

export interface AppConfig {
  deliveryFeeMinor: number;
  currency: string;
}

/** Public app settings from GET /config, fetched once and shared. */
@Injectable({ providedIn: 'root' })
export class ConfigService {
  private readonly http = inject(HttpClient);
  private readonly value = signal<AppConfig | null>(null);
  private readonly state = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');

  readonly config = this.value.asReadonly();
  readonly status = this.state.asReadonly();
  readonly deliveryFeeMinor = computed(() => this.value()?.deliveryFeeMinor ?? null);

  /** Fetches the config unless it is already loaded or loading. */
  load(): void {
    if (this.state() === 'loading' || this.state() === 'ready') {
      return;
    }
    this.state.set('loading');
    this.http.get<AppConfig>(apiUrl('/config')).subscribe({
      next: (config) => {
        this.value.set(config);
        this.state.set('ready');
      },
      error: () => this.state.set('error'),
    });
  }
}
