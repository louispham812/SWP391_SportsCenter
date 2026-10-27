import { apiRequest } from './apiClient';
import { getPublicSports } from './publicContentApi';

export const getUpcomingClasses = () => apiRequest('/bookings/classes');
export const getCoachSchedule = (weekStart) =>
  apiRequest(`/bookings/coach-schedule?weekStart=${encodeURIComponent(weekStart)}`);
export const getCoachStudents = () => apiRequest('/bookings/coach-students');
export const getSessionRoster = (sessionId) =>
  apiRequest(`/bookings/classes/${encodeURIComponent(sessionId)}/roster`);
export const cancelBooking = (bookingId) =>
  apiRequest(`/bookings/${encodeURIComponent(bookingId)}`, { method: 'DELETE' });
export const updateBookingAttendance = (bookingId, status, coachNote) => {
  const query = new URLSearchParams({ status });
  if (coachNote) query.set('coachNote', coachNote);
  return apiRequest(`/bookings/${encodeURIComponent(bookingId)}/attendance?${query}`, {
    method: 'PUT',
  });
};

export const getBookingSports = getPublicSports;
export const getAvailableCourtSlots = (sportId) =>
  apiRequest(`/booking-flow/courts?sportId=${encodeURIComponent(sportId)}`);
export const getBookableClasses = (sportId) =>
  apiRequest(`/booking-flow/classes?sportId=${encodeURIComponent(sportId)}`);
export const getAllBookableClasses = (sportId) =>
  apiRequest(sportId ? `/booking-flow/classes?sportId=${encodeURIComponent(sportId)}` : '/booking-flow/classes');
export const getCoachPublicProfile = (coachId) =>
  apiRequest(`/booking-flow/coaches/${encodeURIComponent(coachId)}`);
export const getBookingCoaches = () => apiRequest('/booking-flow/coaches');
export const getBookingQuote = (bookingType, itemId, startTime, endTime) => {
  const query = new URLSearchParams({ bookingType, itemId: String(itemId) });
  if (startTime) query.set('startTime', startTime);
  if (endTime) query.set('endTime', endTime);
  return apiRequest(`/booking-flow/quote?${query}`);
};
export const checkoutBooking = (bookingType, itemId, startTime, endTime, paymentMethod = 'VIETQR', useQuota = false) =>
  apiRequest('/booking-flow/checkout', {
    method: 'POST',
    body: JSON.stringify({ bookingType, itemId, startTime, endTime, paymentMethod, useQuota }),
  });
export const getMemberBookingSchedule = () => apiRequest('/booking-flow/schedule');
export const cancelMemberBooking = (bookingType, bookingId) =>
  apiRequest(`/booking-flow/schedule/${encodeURIComponent(bookingType)}/${encodeURIComponent(bookingId)}`, {
    method: 'DELETE',
  });
