import { apiRequest } from './apiClient';

export const getCoachProfile = () => apiRequest('/coach/profile');

export const updateCoachProfile = (data) =>
  apiRequest('/coach/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const updateCoachAvatar = (avatarBase64) =>
  apiRequest('/coach/avatar', {
    method: 'PUT',
    body: JSON.stringify({ avatar: avatarBase64 }),
  });

export const getCoachLeaveRequests = () => apiRequest('/coach/leave-requests');

export const createCoachLeaveRequest = (data) =>
  apiRequest('/coach/leave-requests', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getCoachAvailability = () => apiRequest('/coach/availability');

export const updateCoachAvailability = (availabilityJson) =>
  apiRequest('/coach/availability', {
    method: 'PUT',
    body: JSON.stringify({ availabilityJson }),
  });

export const getCoachIncome = () => apiRequest('/coach/income');

export const sendCoachNotice = (data) =>
  apiRequest('/coach/send-notice', {
    method: 'POST',
    body: JSON.stringify(data),
  });

