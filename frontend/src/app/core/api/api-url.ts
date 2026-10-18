import { environment } from '../../../environments/environment';

export const apiUrl = (path: string): string => `${environment.apiUrl}${path}`;

export const isApiUrl = (url: string): boolean => url.startsWith(environment.apiUrl);
