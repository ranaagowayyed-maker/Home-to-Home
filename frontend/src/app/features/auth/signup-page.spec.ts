import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SignupPage } from './signup-page';

describe('SignupPage', () => {
  let fixture: ComponentFixture<SignupPage>;
  let page: SignupPage;

  const fillValid = () =>
    page.form.patchValue({
      name: 'Fatima',
      email: 'fatima@example.com',
      phone: '+20 100 123 4567',
      password: 'secret123',
    });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SignupPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(SignupPage);
    page = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('does not require a kitchen name for customers or delivery people', () => {
    fillValid();
    for (const role of ['CUSTOMER', 'DELIVERY'] as const) {
      page.form.controls.role.setValue(role);
      expect(page.form.controls.kitchenName.valid).withContext(role).toBeTrue();
      expect(page.form.valid).withContext(role).toBeTrue();
    }
  });

  it('requires a 3-60 character kitchen name for mothers and shows the field', () => {
    fillValid();
    page.form.controls.role.setValue('MOTHER');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#kitchenName')).not.toBeNull();
    expect(page.form.controls.kitchenName.hasError('required')).toBeTrue();
    page.form.controls.kitchenName.setValue('ab');
    expect(page.form.controls.kitchenName.hasError('minlength')).toBeTrue();
    page.form.controls.kitchenName.setValue("Fatima's Kitchen");
    expect(page.form.valid).toBeTrue();
  });

  it('validates email, phone and password strength inline', () => {
    page.form.patchValue({ email: 'nope', phone: 'abc', password: 'password' });
    page.submit();
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent;
    expect(text).toContain('Enter a valid email address.');
    expect(text).toContain('Enter a valid phone number');
    expect(text).toContain('Use at least 8 characters with a letter and a number.');
    TestBed.inject(HttpTestingController).expectNone('/api/v1/auth/register');
  });

  it('only sends the kitchen name for mothers and shows email_taken inline', () => {
    const http = TestBed.inject(HttpTestingController);
    fillValid();
    page.form.controls.kitchenName.setValue('ignored');
    page.submit();

    const req = http.expectOne('/api/v1/auth/register');
    expect(req.request.body.kitchenName).toBeUndefined();
    req.flush({ code: 'email_taken' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('#email-error').textContent).toContain(
      'This email is already registered. Log in instead.',
    );
  });
});
