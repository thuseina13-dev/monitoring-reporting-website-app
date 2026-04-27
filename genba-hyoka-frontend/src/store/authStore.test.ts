import { useAuthStore, User } from './authStore';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    jest.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.csrfToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set auth correctly', async () => {
    const user: User = { 
      id: '1', 
      fullName: 'Test User', 
      email: 'test@example.com',
      roles: [{ code: 'emp', name: 'Employee', type: 'employee' }],
      prm: {}
    };
    const csrfToken = 'mock-csrf-token';

    await useAuthStore.getState().setAuth(user, csrfToken);

    const state = useAuthStore.getState();
    expect(state.user?.id).toEqual(user.id);
    expect(state.csrfToken).toBe(csrfToken);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should clear auth correctly', async () => {
    const user: User = { 
      id: '1', 
      fullName: 'Test User', 
      email: 'test@example.com',
      roles: [{ code: 'emp', name: 'Employee', type: 'employee' }],
      prm: {}
    };
    await useAuthStore.getState().setAuth(user, 'mock-csrf');

    await useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.csrfToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('activeRole');
  });
});
