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

