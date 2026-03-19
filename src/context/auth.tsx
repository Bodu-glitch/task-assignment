import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { tokenStore } from '@/lib/api/client';
import type { UserProfile, UserRole } from '@/types/api';

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
  });

  // Restore token on mount
  useEffect(() => {
    tokenStore.get().then(async (token) => {
      if (token) {
        try {
          const { data: user } = await authApi.profile();
          setState({ token, user, isLoading: false });
        } catch {
          await tokenStore.remove();
          setState({ token: null, user: null, isLoading: false });
        }
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    await tokenStore.set(data.access_token);
    const { data: user } = await authApi.profile();
    setState({ token: data.access_token, user, isLoading: false });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    await tokenStore.remove();
    setState({ token: null, user: null, isLoading: false });
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: user } = await authApi.profile();
    setState((s) => ({ ...s, user }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshProfile,
        role: state.user?.role ?? null,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
