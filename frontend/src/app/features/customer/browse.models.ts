import { MealCategory } from '../meals/meals.models';

export interface BrowseMeal {
  id: string;
  name: string;
  description: string;
  category: MealCategory;
  priceMinor: number;
  photoUrl: string | null;
  motherId: string;
  kitchenName: string;
}

export const BROWSE_PAGE_SIZE = 20;

export type BrowseSort = 'newest' | 'price_asc' | 'price_desc';

/** Search and filters for Browse Meals; empty values mean "any". */
export interface BrowseFilters {
  q: string;
  category: MealCategory | '';
  /** Upper price bound in minor units, or null for none. */
  maxPriceMinor: number | null;
  sort: BrowseSort;
}

export const NO_FILTERS: BrowseFilters = {
  q: '',
  category: '',
  maxPriceMinor: null,
  sort: 'newest',
};

export const SORT_OPTIONS: readonly { value: BrowseSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
];

/** Pause after the last keystroke before searching. */
export const SEARCH_DEBOUNCE_MS = 300;

export const NEW_CART_TITLE = 'Start a new cart?';
export const NEW_CART_MESSAGE = 'Your current cart has meals from another kitchen.';
