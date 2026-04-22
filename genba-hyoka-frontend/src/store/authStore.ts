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
  roles: string[] | [];
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  updateAccessToken: (accessToken: string, refreshToken: string) => Promise<void>;
  setActiveRole: (role: string) => void;
  clearAuth: () => Promise<void>;
}

const defaultAdminRoles: any = {
  adm: 'administrator',
  man: 'manager',
  emp: 'employee'
}

const mapUserRoles = (userRoles: string[]) => {
  if (!userRoles) return [];
  if (userRoles.includes('sup')) {
    return ['administrator', 'employee', 'manager'];
  }
  const mappedRoles = userRoles.map((role) => {
    if (defaultAdminRoles[role]) {
      return defaultAdminRoles[role];
    }
    return role;
  });
  return mappedRoles;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  activeRole: null,
  accessToken: null,
  isAuthenticated: false,
  roles: [],

  setAuth: async (user, accessToken, refreshToken) => {
    await storage.setItem('refreshToken', refreshToken);
    // Set first role as default active role if available    
    const isSuperAdmin = user?.roles?.includes('sup')
    const userRoles = mapUserRoles(user?.roles)
    let activeRole = null
    if (isSuperAdmin) {
      activeRole = 'admin';
    } else {
      activeRole = user.roles && user.roles.length > 0 ? user.roles[0] : null;
    }

    console.log({ user, accessToken, isAuthenticated: true, activeRole, roles: userRoles })
    set({ user, accessToken, isAuthenticated: true, activeRole, roles: userRoles });
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
    set({ user: null, accessToken: null, isAuthenticated: false, activeRole: null, roles: [] });
  },
}));

