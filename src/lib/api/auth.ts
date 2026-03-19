import { apiFetch } from './client';
import type { UserProfile } from '@/types/api';

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ data: { access_token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    apiFetch<{ data: { success: boolean } }>('/auth/logout', { method: 'POST' }),

  profile: () =>
    apiFetch<{ data: UserProfile }>('/auth/profile'),

  changePassword: (current_password: string, new_password: string, confirm_password: string) =>
    apiFetch<{ data: { success: boolean } }>('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ current_password, new_password, confirm_password }),
    }),

  forgotPassword: (email: string) =>
    apiFetch<{ data: { message: string } }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (email: string, otp: string, new_password: string, confirm_password: string) =>
    apiFetch<{ data: { success: boolean } }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, new_password, confirm_password }),
    }),

  updateDeviceToken: (device_token: string | null) =>
    apiFetch<{ data: { success: boolean } }>('/auth/device-token', {
      method: 'PATCH',
      body: JSON.stringify({ device_token }),
    }),
};
