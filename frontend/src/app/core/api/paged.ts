export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}
