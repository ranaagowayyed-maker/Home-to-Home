import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ToastService } from '../../shared/ui/toast.service';
import { MealFormPage } from './meal-form-page';
import { Meal } from './meals.models';

describe('MealFormPage', () => {
  let fixture: ComponentFixture<MealFormPage>;
  let page: MealFormPage;
  let http: HttpTestingController;

  const errorText = (field: string): string | undefined =>
    (fixture.nativeElement as HTMLElement).querySelector(`#${field}-error`)?.textContent?.trim();

  function create(id?: string): void {
    fixture = TestBed.createComponent(MealFormPage);
    page = fixture.componentInstance;
    if (id) {
      fixture.componentRef.setInput('id', id);
    }
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MealFormPage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
  });

  afterEach(() => http.verify());

  it('rejects zero, negative and malformed prices', () => {
    create();
    const price = page.form.controls.price;
    const cases: [string, string][] = [
      ['0', 'Price must be greater than 0.'],
      ['0.00', 'Price must be greater than 0.'],
      ['-3', 'Enter a price like 12.50.'],
      ['12.505', 'Enter a price like 12.50.'],
      ['abc', 'Enter a price like 12.50.'],
    ];
    for (const [value, message] of cases) {
      price.setValue(value);
      price.markAsTouched();
      fixture.detectChanges();
      expect(errorText('price')).withContext(value).toBe(message);
    }
    price.setValue('12.5');
    expect(price.valid).toBeTrue();
  });

  it('validates the name length', () => {
    create();
    page.form.controls.name.setValue('ab');
    page.save();
    fixture.detectChanges();
    expect(errorText('name')).toBe('Use at least 3 characters.');
    http.expectNone('/api/v1/meals');
  });

  it('converts the price to minor units and publishes the meal', () => {
    const toast = spyOn(TestBed.inject(ToastService), 'success');
    create();
    page.form.setValue({
      name: 'Stuffed Grape Leaves',
      description: '',
      category: 'MAIN_DISH',
      price: '12.50',
    });
    page.save();

    const req = http.expectOne({ method: 'POST', url: '/api/v1/meals' });
    expect(req.request.body).toEqual({
      name: 'Stuffed Grape Leaves',
      description: '',
      category: 'MAIN_DISH',
      priceMinor: 1250,
    });
    req.flush({ id: 'm1', name: 'Stuffed Grape Leaves' } as Meal);

    expect(toast).toHaveBeenCalledWith("Meal 'Stuffed Grape Leaves' published");
  });

  it('maps server field errors back onto the form', () => {
    create();
    page.form.patchValue({ name: 'Soup', price: '1' });
    page.save();

    http
      .expectOne('/api/v1/meals')
      .flush(
        { code: 'validation_failed', errors: { priceMinor: ['Price is too high.'] } },
        { status: 422, statusText: 'Unprocessable Entity' },
      );
    fixture.detectChanges();
    expect(errorText('price')).toBe('Price is too high.');
  });

  it('loads an existing meal with its price in major units', () => {
    create('m2');
    http
      .expectOne((r) => r.url === '/api/v1/meals/mine')
      .flush({
        items: [
          {
            id: 'm2',
            name: 'Basbousa',
            description: 'Semolina cake',
            category: 'DESSERT',
            priceMinor: 450,
            photoUrl: null,
            isVisible: true,
            isArchived: false,
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
        page: 1,
        pageSize: 50,
        total: 1,
      });

    expect(page.form.getRawValue()).toEqual({
      name: 'Basbousa',
      description: 'Semolina cake',
      category: 'DESSERT',
      price: '4.50',
    });
  });

  it("refuses to edit a meal that is not the mother's own", () => {
    create('someone-else');
    http
      .expectOne((r) => r.url === '/api/v1/meals/mine')
      .flush({ items: [], page: 1, pageSize: 50, total: 0 });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('You can only edit your own meals.');
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });
});
