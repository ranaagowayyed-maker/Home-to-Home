export type Role = 'CUSTOMER' | 'MOTHER' | 'DELIVERY';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  address: string | null;
  city: string | null;
  kitchenName: string | null;
}

export interface AuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  kitchenName?: string;
}

export const ROLE_HOME: Record<Role, string> = {
  CUSTOMER: '/browse',
  MOTHER: '/my-meals',
  DELIVERY: '/deliveries',
};
