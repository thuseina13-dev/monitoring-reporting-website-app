import { create } from 'zustand';
import { storage } from '../utils/storage';

export interface User {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
  prm: number;
}

export interface AuthState {
  user: User | null;
  activeRole: string | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  updateAccessToken: (accessToken: string, refreshToken: string) => Promise<void>;
  setActiveRole: (role: string) => void;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  activeRole: null,
  accessToken: null,
  isAuthenticated: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await storage.setItem('refreshToken', refreshToken);
    // Set first role as default active role if available
    const activeRole = user.roles && user.roles.length > 0 ? user.roles[0] : null;
    set({ user, accessToken, isAuthenticated: true, activeRole });
  },

  updateAccessToken: async (accessToken, refreshToken) => {
    await storage.setItem('refreshToken', refreshToken);
    set({ accessToken });
  },

  setActiveRole: (role) => {
    set({ activeRole: role });
  },

  clearAuth: async () => {
    await storage.removeItem('refreshToken');
    set({ user: null, accessToken: null, isAuthenticated: false, activeRole: null });
  },
}));

