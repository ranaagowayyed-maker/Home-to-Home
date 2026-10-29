import { AuthResponse, User } from './auth.models';

export const TEST_USER: User = {
  id: 'u1',
  name: 'Fatima',
  email: 'fatima@example.com',
  phone: '+20 100 123 4567',
  role: 'MOTHER',
  address: null,
  city: null,
  kitchenName: "Fatima's Kitchen",
  bio: null,
  isAvailable: true,
};

export const authResponse = (token = 'access-1', user: User = TEST_USER): AuthResponse => ({
  accessToken: token,
  accessTokenExpiresAt: '2030-01-01T00:00:00Z',
  user,
});
