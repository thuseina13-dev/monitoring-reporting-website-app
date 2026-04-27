import { create } from 'zustand';
import { storage } from '../utils/storage';

export interface User {
  id: string;
  fullName: string;
  email: string;
  roles: { code: string; name: string; type: string }[];
  prm: Record<string, number>;
  isSuperAdmin?: boolean;
}

export interface AuthState {
  user: User | null;
  activeRole: string | null;
  roles: { code: string; name: string; type: string }[] | [];
  csrfToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, csrfToken: string) => void;
  updateCsrfToken: (csrfToken: string) => void;
  setActiveRole: (role: string) => void;
  clearAuth: () => Promise<void>;
}

const DEFAULT_ROLES = [
  { code: 'adm', name: 'Administrator', type: 'admin' },
  { code: 'man', name: 'Manager', type: 'manager' },
  { code: 'emp', name: 'Employee', type: 'employee' }
];

const mapUserRoles = (userRoles: { code: string; name: string; type: string }[]) => {
  if (!userRoles) return [];
  const isSuperAdmin = userRoles.some(r => r.code === 'sup');
  if (isSuperAdmin) {
    return DEFAULT_ROLES;
  }
  return userRoles;
}

export const useAuthStore = create<AuthState>((set): AuthState => ({
    user: null,
    activeRole: null,
    csrfToken: null,
    isAuthenticated: false,
    roles: [],
    setAuth: (user: User, csrfToken: string) => {
      const roleCodes = user?.roles?.map(r => r.code) || [];
      const isSuperAdmin = roleCodes.includes('sup');
      
      // Mark user as super admin
      const userWithSuperAdmin = { ...user, isSuperAdmin };
      
      const userRoles = mapUserRoles(user?.roles);
      let activeRole = null;
      if (isSuperAdmin) {
        activeRole = 'adm';
      } else {
        activeRole = roleCodes.length > 0 ? roleCodes[0] : null;
      }

      console.log('auth data', { user: userWithSuperAdmin, isAuthenticated: true, activeRole, roles: userRoles, csrfToken })
      set({ user: userWithSuperAdmin, csrfToken, isAuthenticated: true, activeRole, roles: userRoles });
    },
    updateCsrfToken: (csrfToken: string) => {
      set({ csrfToken });
    },
    setActiveRole: async (role: string) => {
      await storage.setItem('activeRole', role);
      set({ activeRole: role });
    },
    clearAuth: async () => {
      await storage.removeItem('activeRole');
      set({ user: null, csrfToken: null, isAuthenticated: false, activeRole: null, roles: [] });
    },
  })
);

