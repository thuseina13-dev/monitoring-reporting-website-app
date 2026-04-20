import { create } from 'zustand';
import { storage } from '../utils/storage';

interface User {
  id: string;
  fullName: string;
  email: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  updateAccessToken: (accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await storage.setItem('refreshToken', refreshToken);
    set({ user, accessToken, isAuthenticated: true });
  },

  updateAccessToken: async (accessToken, refreshToken) => {
    await storage.setItem('refreshToken', refreshToken);
    set({ accessToken });
  },

  clearAuth: async () => {
    await storage.removeItem('refreshToken');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
