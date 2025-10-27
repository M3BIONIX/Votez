'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { toast } from 'sonner';
import { TOAST_MESSAGES } from '@/application-shared/constants/toaster-constants';
import { login as apiLogin, register as apiRegister, getCurrentUser } from '@/lib/api';
import { getToken as getAuthToken, setToken as setAuthToken, clearToken as clearAuthToken } from '@/lib/token-utils';
import { User } from '@/application-shared/interfaces/user-interfaces';
import { AuthContextType } from '@/application-shared/interfaces/auth-interfaces';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasCheckedAuth = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await getCurrentUser();
        setUser(userData);
      } catch (error) {
        setUser(null);
        clearAuthToken();
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      clearAuthToken();
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasCheckedAuth.current) {
      hasCheckedAuth.current = true;
      refreshUser();
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await apiLogin(email, password);
      setAuthToken(data.access_token);
      
      const userData = await getCurrentUser();
      setUser(userData);
      toast.success(TOAST_MESSAGES.AUTH.LOGIN_SUCCESS);
    } catch (error: any) {
      toast.error(error.message || TOAST_MESSAGES.AUTH.LOGIN_FAILED);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      await apiRegister(email, password, name);
      await login(email, password);
      toast.success(TOAST_MESSAGES.AUTH.ACCOUNT_CREATED);
    } catch (error: any) {
      toast.error(error.message || TOAST_MESSAGES.AUTH.REGISTER_FAILED);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    clearAuthToken();
    toast.success(TOAST_MESSAGES.AUTH.LOGOUT_SUCCESS);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



