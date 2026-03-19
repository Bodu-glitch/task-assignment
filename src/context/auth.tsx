import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '@/lib/api/auth';
import { tokenStore } from '@/lib/api/client';
import type { UserProfile, UserRole, TenantOption, LoginSingleResponse, LoginSuperadminResponse } from '@/types/api';

interface PendingSelection {
  userId: string;
  tenants: TenantOption[];
}

interface AuthState {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  pendingSelection: PendingSelection | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  register: (email: string, password: string, fullName: string, tenantName: string, tenantSlug?: string) => Promise<void>;
  selectTenant: (userId: string, tenantId: string) => Promise<void>;
  role: UserRole | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    pendingSelection: null,
  });

  // Restore token on mount
  useEffect(() => {
    tokenStore.get().then(async (token) => {
      if (token) {
        try {
          const { data: user } = await authApi.profile();
          setState({ token, user, isLoading: false, pendingSelection: null });
        } catch {
          await tokenStore.remove();
          setState({ token: null, user: null, isLoading: false, pendingSelection: null });
        }
      } else {
        setState((s) => ({ ...s, isLoading: false }));
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);

    if ('requires_tenant_selection' in data && data.requires_tenant_selection) {
      setState((s) => ({ ...s, pendingSelection: { userId: data.user.id, tenants: data.tenants } }));
      return;
    }

    const tokenData = data as LoginSingleResponse | LoginSuperadminResponse;
    await tokenStore.set(tokenData.access_token);
    const { data: user } = await authApi.profile();
    setState({ token: tokenData.access_token, user, isLoading: false, pendingSelection: null });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout errors
    }
    await tokenStore.remove();
    setState({ token: null, user: null, isLoading: false, pendingSelection: null });
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: user } = await authApi.profile();
    setState((s) => ({ ...s, user }));
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string, tenantName: string, tenantSlug?: string) => {
    const { data } = await authApi.register({ email, password, full_name: fullName, tenant_name: tenantName, tenant_slug: tenantSlug });
    await tokenStore.set(data.access_token);
    const { data: user } = await authApi.profile();
    setState({ token: data.access_token, user, isLoading: false, pendingSelection: null });
  }, []);

  const selectTenant = useCallback(async (userId: string, tenantId: string) => {
    const { data } = await authApi.selectTenant(userId, tenantId);
    await tokenStore.set(data.access_token);
    const { data: user } = await authApi.profile();
    setState({ token: data.access_token, user, isLoading: false, pendingSelection: null });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        refreshProfile,
        register,
        selectTenant,
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
