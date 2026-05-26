import { create } from 'zustand';
import type { AuthUserDto } from '@flexup/shared';

interface AuthState {
  accessToken: string | null;
  user: AuthUserDto | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUserDto) => void;
  setAccessToken: (token: string, user: AuthUserDto) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setAuth: (token, user) => set({ accessToken: token, user, isAuthenticated: true }),
  setAccessToken: (token, user) => set({ accessToken: token, user, isAuthenticated: true }),
  logout: () => {
    set({ accessToken: null, user: null, isAuthenticated: false });
    import('@/features/companies/stores/company.store').then(({ clearActiveCompany }) => {
      clearActiveCompany();
    }).catch(() => undefined);
  },
}));

export const getAccessToken = () => useAuthStore.getState().accessToken;
export const setAccessToken = (token: string, user: AuthUserDto) =>
  useAuthStore.getState().setAuth(token, user);
export const logout = () => useAuthStore.getState().logout();
