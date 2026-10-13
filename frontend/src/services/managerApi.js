import { apiRequest } from './apiClient';

export const getPendingStaffRegistrations = () =>
  apiRequest('/manager/staff-registrations');

export const approveStaffRegistration = (userId) =>
  apiRequest(`/manager/staff-registrations/${userId}/approve`, { method: 'PATCH' });

export const rejectStaffRegistration = (userId) =>
  apiRequest(`/manager/staff-registrations/${userId}/reject`, { method: 'PATCH' });
