import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Role } from '../../core/auth/auth.models';

interface RoleCard {
  role: Role;
  title: string;
  text: string;
}

@Component({
  selector: 'app-landing-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './landing-page.html',
})
export class LandingPage {
  protected readonly roles: RoleCard[] = [
    {
      role: 'CUSTOMER',
      title: 'Order homemade food',
      text: 'Fresh meals cooked by mothers near you.',
    },
    {
      role: 'MOTHER',
      title: 'Sell what you cook',
      text: 'List your dishes and earn from your kitchen.',
    },
    {
      role: 'DELIVERY',
      title: 'Deliver meals',
      text: 'Pick up nearby orders and get paid per trip.',
    },
  ];
}
