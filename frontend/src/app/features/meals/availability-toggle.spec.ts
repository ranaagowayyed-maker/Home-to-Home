import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { authResponse, TEST_USER } from '../../core/auth/auth.testing';
import { ToastService } from '../../shared/ui/toast.service';
import { AvailabilityToggle, PAUSED_MESSAGE } from './availability-toggle';

describe('AvailabilityToggle', () => {
  let fixture: ComponentFixture<AvailabilityToggle>;
  let http: HttpTestingController;
  let auth: AuthService;
  let toast: ToastService;

  const toggle = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[role="switch"]')!;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AvailabilityToggle],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    toast = TestBed.inject(ToastService);
    auth.login({ email: TEST_USER.email, password: 'x' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush(authResponse());
    fixture = TestBed.createComponent(AvailabilityToggle);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('pauses the kitchen and confirms it', () => {
    const success = spyOn(toast, 'success');
    expect(toggle().getAttribute('aria-checked')).toBe('true');

    toggle().click();
    fixture.detectChanges();
    const req = http.expectOne({ method: 'PATCH', url: '/api/v1/mothers/me/availability' });
    expect(req.request.body).toEqual({ isAvailable: false });
    expect(toggle().disabled).toBeTrue();
    req.flush({ isAvailable: false });
    fixture.detectChanges();

    expect(toggle().getAttribute('aria-checked')).toBe('false');
    expect(auth.currentUser()?.isAvailable).toBeFalse();
    expect(success).toHaveBeenCalledWith(PAUSED_MESSAGE);
  });

  it('reverts the switch when saving fails', () => {
    const error = spyOn(toast, 'error');

    toggle().click();
    fixture.detectChanges();
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    http
      .expectOne('/api/v1/mothers/me/availability')
      .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(toggle().getAttribute('aria-checked')).toBe('true');
    expect(auth.currentUser()?.isAvailable).toBeTrue();
    expect(error).toHaveBeenCalled();
  });
});
