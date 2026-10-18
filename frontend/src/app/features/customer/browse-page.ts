import { ChangeDetectionStrategy, Component } from '@angular/core';
import { EmptyState } from '../../shared/ui/empty-state';

@Component({
  selector: 'app-browse-page',
  imports: [EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="mb-6 text-2xl font-bold">Browse Meals</h1>
    <app-empty-state message="Browse Meals — coming in Phase 2" />
  `,
})
export class BrowsePage {}
