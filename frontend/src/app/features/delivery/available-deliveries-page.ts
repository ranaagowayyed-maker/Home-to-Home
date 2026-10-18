import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState } from '../../shared/ui/empty-state';

@Component({
  selector: 'app-available-deliveries-page',
  imports: [EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-6 text-2xl font-bold">Available Deliveries</h1>
    <app-empty-state message="Available Deliveries — coming in Phase 2" />
  `,
})
export class AvailableDeliveriesPage {}
