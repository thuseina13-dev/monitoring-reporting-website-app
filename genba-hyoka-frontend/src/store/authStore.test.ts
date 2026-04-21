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
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set auth correctly', async () => {
    const user: User = { 
      id: '1', 
      fullName: 'Test User', 
      email: 'test@example.com',
      roles: ['employee'],
      prm: 8
    };
    const accessToken = 'access-token';
    const refreshToken = 'refresh-token';

    await useAuthStore.getState().setAuth(user, accessToken, refreshToken);


    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.accessToken).toBe(accessToken);
    expect(state.isAuthenticated).toBe(true);
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('refreshToken', refreshToken);
  });

  it('should clear auth correctly', async () => {
    const user: User = { 
      id: '1', 
      fullName: 'Test User', 
      email: 'test@example.com',
      roles: ['employee'],
      prm: 8
    };
    await useAuthStore.getState().setAuth(user, 'at', 'rt');


    await useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('refreshToken');
  });
});
