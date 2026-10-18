import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MAX_QUANTITY, MIN_QUANTITY } from '../../core/cart/cart.models';
import { CartService } from '../../core/cart/cart.service';
import { MoneyPipe } from '../../shared/lib/money.pipe';
import { Button } from '../../shared/ui/button';
import { EmptyState } from '../../shared/ui/empty-state';
import { MEAL_PLACEHOLDER_IMAGE } from '../meals/meals.models';
import { CartTotals } from './cart-totals';

@Component({
  selector: 'app-cart-page',
  imports: [RouterLink, MoneyPipe, Button, CartTotals, EmptyState],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cart-page.html',
})
export class CartPage {
  protected readonly cart = inject(CartService);

  protected readonly placeholder = MEAL_PLACEHOLDER_IMAGE;
  protected readonly min = MIN_QUANTITY;
  protected readonly max = MAX_QUANTITY;
}
