import { apiRequest } from './apiClient';

export const getMemberProfile = () => apiRequest('/members/me');

export const updateMemberProfile = (profile) =>
  apiRequest('/members/me', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });

export const updateMemberAvatar = (avatar) =>
  apiRequest('/members/me/avatar', {
    method: 'PUT',
    body: JSON.stringify({ avatar }),
  });

export const getMemberHealthProfile = () => apiRequest('/members/me/health');

export const updateMemberHealthProfile = (profile) =>
  apiRequest('/members/me/health', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });

export const getMemberMemberships = () => apiRequest('/members/me/memberships');

export const purchaseMembership = (packageId, paymentMethod = 'VIETQR') =>
  apiRequest('/members/me/memberships', {
    method: 'POST',
    body: JSON.stringify({ packageId, paymentMethod }),
  });

export const getMemberAttendance = () => apiRequest('/members/me/attendance');

export const getMemberNotifications = () => apiRequest('/members/me/notifications');

export const getMemberTransactions = () => apiRequest('/members/me/transactions');
