import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveTokens, clearTokens } from '@/lib/auth';

export type UserRole = 'ADMIN' | 'MANAGER' | 'SHIPPER' | 'CUSTOMER' | 'CONTRACTOR';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  companyName?: string;
  taxId?: string;
  shipperId?: string;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: UserProfile, refreshToken?: string) => void;
  setTokens: (token: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user, refreshToken) => {
        if (typeof window !== 'undefined') {
          saveTokens(token, refreshToken || '');
        }
        set({
          token,
          refreshToken: refreshToken || null,
          user,
          isAuthenticated: true,
        });
      },

      setTokens: (token, refreshToken) => {
        if (typeof window !== 'undefined') {
          saveTokens(token, refreshToken);
        }
        set({
          token,
          refreshToken,
          isAuthenticated: true,
        });
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          clearTokens();
        }
        set({
          token: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'tdt-auth-storage',
    }
  )
);
