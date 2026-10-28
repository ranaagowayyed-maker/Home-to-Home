import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BrowsePage } from './browse-page';
import { BrowseMeal, SEARCH_DEBOUNCE_MS } from './browse.models';

const meal = (id: string, name = 'Stuffed Grape Leaves'): BrowseMeal => ({
  id,
  name,
  description: '',
  category: 'MAIN_DISH',
  priceMinor: 1250,
  photoUrl: null,
  motherId: 'mother-a',
  kitchenName: "Fatima's Kitchen",
});

describe('BrowsePage', () => {
  let fixture: ComponentFixture<BrowsePage>;
  let http: HttpTestingController;

  const el = (): HTMLElement => fixture.nativeElement as HTMLElement;
  const text = (): string => el().textContent ?? '';
  const browse = () => http.expectOne((req) => req.url === '/api/v1/meals');
  const flushPage = (items: BrowseMeal[], total = items.length) => {
    browse().flush({ items, page: 1, pageSize: 20, total });
    fixture.detectChanges();
  };

  function type(testId: string, value: string): void {
    const input = el().querySelector<HTMLInputElement>(`[data-testid="${testId}"]`)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }

  function choose(testId: string, value: string): void {
    const select = el().querySelector<HTMLSelectElement>(`[data-testid="${testId}"]`)!;
    select.value = value;
    select.dispatchEvent(new Event('change'));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BrowsePage],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BrowsePage);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('loads every meal with no filters and shows the result count', () => {
    const req = browse();
    expect(req.request.params.keys().sort()).toEqual(['page', 'pageSize']);
    req.flush({ items: [meal('m1'), meal('m2', 'Koshari')], page: 1, pageSize: 20, total: 12 });
    fixture.detectChanges();

    expect(el().querySelector('[data-testid="result-count"]')?.textContent).toContain('12 meals');
  });

  it('searches after a 300 ms pause and combines the filters', fakeAsync(() => {
    flushPage([meal('m1')]);

    type('search', 'grape');
    tick(SEARCH_DEBOUNCE_MS - 50);
    type('search', 'grape leaves');
    tick(SEARCH_DEBOUNCE_MS - 50);
    http.expectNone((req) => req.url === '/api/v1/meals');
    tick(50);
    let req = browse();
    expect(req.request.params.get('q')).toBe('grape leaves');
    req.flush({ items: [meal('m1')], page: 1, pageSize: 20, total: 1 });

    choose('category', 'MAIN_DISH');
    req = browse();
    expect(req.request.params.get('category')).toBe('MAIN_DISH');
    req.flush({ items: [meal('m1')], page: 1, pageSize: 20, total: 1 });

    type('max-price', '20.5');
    tick(SEARCH_DEBOUNCE_MS);
    req = browse();
    expect(req.request.params.get('maxPriceMinor')).toBe('2050');
    req.flush({ items: [meal('m1')], page: 1, pageSize: 20, total: 1 });

    choose('sort', 'price_asc');
    req = browse();
    expect(req.request.params.get('q')).toBe('grape leaves');
    expect(req.request.params.get('category')).toBe('MAIN_DISH');
    expect(req.request.params.get('maxPriceMinor')).toBe('2050');
    expect(req.request.params.get('sort')).toBe('price_asc');
    req.flush({ items: [meal('m1')], page: 1, pageSize: 20, total: 1 });
  }));

  it('does not search while the maximum price is invalid', fakeAsync(() => {
    flushPage([meal('m1')]);

    type('max-price', '0');
    tick(SEARCH_DEBOUNCE_MS);
    fixture.detectChanges();

    http.expectNone((req) => req.url === '/api/v1/meals');
    expect(text()).toContain('Enter a price above 0.');
  }));

  it('offers to clear filters when nothing matches, then restores the full list', fakeAsync(() => {
    flushPage([meal('m1')]);
    type('search', 'pizza');
    tick(SEARCH_DEBOUNCE_MS);
    flushPage([]);

    expect(text()).toContain('No meals match your search.');
    const clear = Array.from(el().querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Clear filters'),
    )!;
    clear.click();

    const req = browse();
    expect(req.request.params.has('q')).toBeFalse();
    req.flush({ items: [meal('m1')], page: 1, pageSize: 20, total: 1 });
    fixture.detectChanges();
    expect(el().querySelector<HTMLInputElement>('[data-testid="search"]')!.value).toBe('');
    expect(text()).toContain('1 meal');
  }));

  it('keeps the previous results when a search fails', fakeAsync(() => {
    flushPage([meal('m1', 'Koshari')]);

    type('search', 'grape');
    tick(SEARCH_DEBOUNCE_MS);
    browse().flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(text()).toContain("Couldn't update the results.");
    expect(text()).toContain('Koshari');
  }));
});
