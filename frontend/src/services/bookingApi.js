import { apiRequest } from './apiClient';

export const getUpcomingClasses = () => apiRequest('/bookings/classes');
export const getMySchedule = () => apiRequest('/bookings/my-schedule');
export const getSessionRoster = (sessionId) =>
  apiRequest(`/bookings/classes/${encodeURIComponent(sessionId)}/roster`);
export const createBooking = (sessionId) =>
  apiRequest(`/bookings?sessionId=${encodeURIComponent(sessionId)}`, { method: 'POST' });
export const cancelBooking = (bookingId) =>
  apiRequest(`/bookings/${encodeURIComponent(bookingId)}`, { method: 'DELETE' });
export const updateBookingAttendance = (bookingId, status, coachNote) => {
  const query = new URLSearchParams({ status });
  if (coachNote) query.set('coachNote', coachNote);
  return apiRequest(`/bookings/${encodeURIComponent(bookingId)}/attendance?${query}`, {
    method: 'PUT',
  });
};
