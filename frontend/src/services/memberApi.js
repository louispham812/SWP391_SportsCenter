import { apiRequest } from './apiClient';

export const getMemberProfile = () => apiRequest('/members/me');

export const updateMemberProfile = (profile) =>
  apiRequest('/members/me', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });

export const getMemberHealthProfile = () => apiRequest('/members/me/health');

export const updateMemberHealthProfile = (profile) =>
  apiRequest('/members/me/health', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });

export const getMemberMemberships = () => apiRequest('/members/me/memberships');
