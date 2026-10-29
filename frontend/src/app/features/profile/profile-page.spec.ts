import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { User } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { authResponse, TEST_USER } from '../../core/auth/auth.testing';
import { ToastService } from '../../shared/ui/toast.service';
import { ProfilePage } from './profile-page';

const CUSTOMER: User = {
  ...TEST_USER,
  id: 'c1',
  role: 'CUSTOMER',
  kitchenName: null,
  isAvailable: null,
};

describe('ProfilePage', () => {
  let fixture: ComponentFixture<ProfilePage>;
  let page: ProfilePage;
  let http: HttpTestingController;
  let auth: AuthService;
  let toast: jasmine.Spy;

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;

  function create(user: User): void {
    auth = TestBed.inject(AuthService);
    auth.login({ email: user.email, password: 'x' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush(authResponse('t', user));
    fixture = TestBed.createComponent(ProfilePage);
    page = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    toast = spyOn(TestBed.inject(ToastService), 'success');
  });

  afterEach(() => http.verify());

  it('shows email and role read-only and saves only editable fields', () => {
    create({ ...CUSTOMER, address: '12 Nile Street', city: 'Cairo' });
    expect(el().querySelector('[data-testid="profile-email"]')?.textContent).toContain(
      CUSTOMER.email,
    );
    expect(el().querySelector('#kitchenName')).toBeNull();

    page.form.patchValue({ address: '5 Tahrir Square', phone: '+20 111 222 3333' });
    page.save();

    const req = http.expectOne({ method: 'PATCH', url: '/api/v1/users/me' });
    expect(req.request.body).toEqual({
      name: CUSTOMER.name,
      phone: '+20 111 222 3333',
      address: '5 Tahrir Square',
      city: 'Cairo',
    });
    const saved = {
      ...CUSTOMER,
      phone: '+20 111 222 3333',
      address: '5 Tahrir Square',
      city: 'Cairo',
    };
    req.flush(saved);

    expect(toast).toHaveBeenCalledWith('Profile updated');
    // Checkout reads the signed-in user, so the next checkout is prefilled with the new address.
    expect(auth.currentUser()?.address).toBe('5 Tahrir Square');
  });

  it('lets mothers edit their kitchen name and bio', () => {
    create(TEST_USER);

    page.form.patchValue({ kitchenName: "Fatima's Home Kitchen", bio: 'Cairo recipes.' });
    page.save();

    const req = http.expectOne({ method: 'PATCH', url: '/api/v1/users/me' });
    expect(req.request.body).toEqual(
      jasmine.objectContaining({ kitchenName: "Fatima's Home Kitchen", bio: 'Cairo recipes.' }),
    );
    req.flush({ ...TEST_USER, kitchenName: "Fatima's Home Kitchen", bio: 'Cairo recipes.' });
    expect(auth.currentUser()?.kitchenName).toBe("Fatima's Home Kitchen");
  });

  it('blocks an invalid phone or empty name without calling the API', () => {
    create(CUSTOMER);

    page.form.patchValue({ name: '', phone: 'call me' });
    page.save();
    fixture.detectChanges();

    http.expectNone('/api/v1/users/me');
    expect(el().textContent).toContain('This field is required.');
    expect(el().textContent).toContain('Enter a valid phone number');
  });

  it('shows server field errors and keeps the values on a network failure', () => {
    create(CUSTOMER);

    page.form.patchValue({ phone: '+20 111 222 3333' });
    page.save();
    http.expectOne('/api/v1/users/me').flush(
      {
        code: 'validation_failed',
        status: 422,
        errors: { phone: ['Enter a valid phone number.'] },
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );
    fixture.detectChanges();
    expect(page.form.controls.phone.errors).toEqual({ server: 'Enter a valid phone number.' });

    page.form.patchValue({ phone: '+20 111 222 4444' });
    page.save();
    http.expectOne('/api/v1/users/me').error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(el().querySelector('[role="alert"]')?.textContent).toContain(
      "Couldn't save your profile.",
    );
    expect(page.form.controls.phone.value).toBe('+20 111 222 4444');
  });
});
