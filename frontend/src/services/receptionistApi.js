import { apiRequest } from './apiClient';

export const searchReceptionistMembers = (query, page = 0) => {
  const params = new URLSearchParams({ query, page: String(page), size: '20' });
  return apiRequest(`/receptionist/members?${params}`);
};

export const getReceptionistClasses = (weekStart) =>
  apiRequest(`/bookings/receptionist-schedule?weekStart=${encodeURIComponent(weekStart)}`);

export const getReceptionistReport = (date) =>
  apiRequest(`/receptionist/report?date=${encodeURIComponent(date)}`);

export const createReceptionistUser = (userData) =>
  apiRequest('/receptionist/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

export const updateReceptionMemberAvatar = (memberId, avatar) =>
  apiRequest(`/receptionist/members/${memberId}/avatar`, {
    method: 'PUT',
    body: JSON.stringify({ avatar }),
  });

export const updateReceptionMemberRfid = (memberId, rfidCode) =>
  apiRequest(`/receptionist/members/${memberId}/rfid`, {
    method: 'PUT',
    body: JSON.stringify({ rfidCode }),
  });

export const lookupReceptionCard = (code) =>
  apiRequest(`/receptionist/lookup-card?code=${encodeURIComponent(code)}`);

export const sellReceptionMembership = (saleData) =>
  apiRequest('/receptionist/memberships', {
    method: 'POST',
    body: JSON.stringify(saleData),
  });

export const checkInReceptionMember = (data) =>
  apiRequest('/receptionist/check-in', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getReceptionistOverview = () =>
  apiRequest('/receptionist/dashboard-overview');

export const getReceptionistProfile = () =>
  apiRequest('/receptionist/profile');

export const updateReceptionistProfile = (data) =>
  apiRequest('/receptionist/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const updateReceptionistAvatar = (avatar) =>
  apiRequest('/receptionist/avatar', {
    method: 'PUT',
    body: JSON.stringify({ avatar }),
  });

export const changeReceptionistPassword = (data) =>
  apiRequest('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });

