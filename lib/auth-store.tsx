'use client';

import { create } from 'zustand';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/application-shared/constants/toaster-constants';
import { login as apiLogin, register as apiRegister, getCurrentUser } from '@/lib/api';
import { getToken as getAuthToken, setToken as setAuthToken, clearToken as clearAuthToken } from '@/lib/token-utils';
import { User } from '@/application-shared/interfaces/user-interfaces';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  initialized: boolean;
  
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isLoading: true,
  initialized: false,

  login: async (email, password) => {
    try {
      const data = await apiLogin(email, password);
      setAuthToken(data.access_token);
      
      const userData = await getCurrentUser();
      set({ user: userData, isLoading: false });
      toast.success(TOAST_MESSAGES.AUTH.LOGIN_SUCCESS);
    } catch (error: any) {
      set({ isLoading: false });
      toast.error(error.message || TOAST_MESSAGES.AUTH.LOGIN_FAILED);
      throw error;
    }
  },

  register: async (email, password, name) => {
    try {
      await apiRegister(email, password, name);
      // Automatically log in after registration
      await get().login(email, password);
      toast.success(TOAST_MESSAGES.AUTH.ACCOUNT_CREATED);
    } catch (error: any) {
      toast.error(error.message || TOAST_MESSAGES.AUTH.REGISTER_FAILED);
      throw error;
    }
  },

  logout: () => {
    set({ user: null });
    clearAuthToken();
    toast.success(TOAST_MESSAGES.AUTH.LOGOUT_SUCCESS);
  },

  refreshUser: async () => {
    try {
      set({ isLoading: true });
      const token = getAuthToken();
      if (!token) {
        set({ isLoading: false });
        return;
      }

      try {
        const userData = await getCurrentUser();
        set({ user: userData, isLoading: false, initialized: true });
      } catch (error) {
        set({ user: null, isLoading: false, initialized: true });
        clearAuthToken();
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      set({ user: null, isLoading: false, initialized: true });
      clearAuthToken();
    }
  },

  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));

// Auth initialization component
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { refreshUser, initialized } = useAuthStore();
  const hasCheckedAuth = useRef(false);

  useEffect(() => {
    if (!hasCheckedAuth.current && !initialized) {
      hasCheckedAuth.current = true;
      refreshUser();
    }
  }, [initialized, refreshUser]);

  return <>{children}</>;
}

// Legacy hook for backward compatibility
export const useAuth = () => {
  const { user, isLoading, login, register, logout, refreshUser } = useAuthStore();
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };
};



