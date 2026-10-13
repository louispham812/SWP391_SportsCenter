import { apiRequest } from './apiClient';

export const getPendingStaffRegistrations = () =>
  apiRequest('/manager/staff-registrations');

export const approveStaffRegistration = (userId) =>
  apiRequest(`/manager/staff-registrations/${userId}/approve`, { method: 'PATCH' });

export const rejectStaffRegistration = (userId) =>
  apiRequest(`/manager/staff-registrations/${userId}/reject`, { method: 'PATCH' });

export const getManagerMembers = ({ query = '', status = '', page = 0, size = 12 }) => {
  const params = new URLSearchParams({
    query,
    page: String(page),
    size: String(size),
  });
  if (status) params.set('status', status);
  return apiRequest(`/manager/members?${params}`);
};

export const lockManagerMember = (userId) =>
  apiRequest(`/manager/members/${userId}/lock`, { method: 'PATCH' });

export const unlockManagerMember = (userId) =>
  apiRequest(`/manager/members/${userId}/unlock`, { method: 'PATCH' });
