import { apiFetch } from './client';
import type { StaffMember, Invitation, PaginatedResponse } from '@/types/api';

export const staffApi = {
  list: (page = 1, limit = 20) =>
    apiFetch<PaginatedResponse<StaffMember>>(`/staff?page=${page}&limit=${limit}`),

  invitations: (page = 1, limit = 20) =>
    apiFetch<PaginatedResponse<Invitation>>(`/staff/invitations?page=${page}&limit=${limit}`),

  invite: (email: string, role: 'staff' | 'operator' = 'staff') =>
    apiFetch<{ data: Invitation }>('/staff/invite', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),

  resendInvite: (id: string) =>
    apiFetch<{ data: { success: boolean } }>(`/staff/invite/${id}/resend`, {
      method: 'POST',
    }),

  remove: (id: string) =>
    apiFetch<{ data: { success: boolean } }>(`/staff/${id}`, {
      method: 'DELETE',
    }),

  register: (token: string, full_name: string, password: string, phone?: string) =>
    apiFetch<{ data: StaffMember }>('/staff/register', {
      method: 'POST',
      body: JSON.stringify({ token, full_name, password, phone }),
    }),
};
