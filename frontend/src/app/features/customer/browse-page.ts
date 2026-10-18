import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MoneyPipe } from '../../shared/lib/money.pipe';
import { PagedList } from '../../shared/lib/paged-list';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { ErrorBanner } from '../../shared/ui/error-banner';
import { Skeleton } from '../../shared/ui/skeleton';
import { MEAL_PLACEHOLDER_IMAGE } from '../meals/meals.models';
import { BrowseApi } from './browse-api';
import { BrowseMeal } from './browse.models';

@Component({
  selector: 'app-browse-page',
  imports: [MoneyPipe, Button, EmptyState, ErrorBanner, Skeleton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './browse-page.html',
})
export class BrowsePage {
  private readonly api = inject(BrowseApi);

  protected readonly placeholder = MEAL_PLACEHOLDER_IMAGE;
  protected readonly skeletons = [1, 2, 3, 4];
  protected readonly meals = new PagedList<BrowseMeal>((page) => this.api.list(page));

  constructor() {
    this.meals.load();
  }
}
