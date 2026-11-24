import { apiRequest } from './apiClient';

export const searchReceptionistMembers = (query, page = 0) => {
  const params = new URLSearchParams({ query, page: String(page), size: '20' });
  return apiRequest(`/receptionist/members?${params}`);
};

export const getReceptionistClasses = (weekStart) =>
  apiRequest(`/bookings/receptionist-schedule?weekStart=${encodeURIComponent(weekStart)}`);

export const getReceptionistReport = (date) =>
  apiRequest(`/receptionist/report?date=${encodeURIComponent(date)}`);

export const getReceptionistDomainSports = () =>
  apiRequest('/receptionist/domain-sports');

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

export const updateReceptionMemberEmergencyContact = (memberId, data) =>
  apiRequest(`/receptionist/members/${memberId}/emergency-contact`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const lookupReceptionCard = async (code) => {
  const profile = await apiRequest(`/receptionist/lookup-card?code=${encodeURIComponent(code)}`);
  const eligibilityUrl = `/receptionist/check-in-eligibility?memberId=${profile.userId}`;
  const [checkInEligibility, todayBookings] = await Promise.all([
    apiRequest(eligibilityUrl),
    Promise.all((profile.todayBookings || []).map(async (booking) => (
      booking.bookingType === 'COURT' && booking.status === 'CONFIRMED'
        ? { ...booking, checkInEligibility: await apiRequest(`${eligibilityUrl}&bookingId=${booking.bookingId}`) }
        : booking
    ))),
  ]);
  return { ...profile, checkInEligibility, todayBookings };
};

export const checkInReceptionMember = (data) =>
  apiRequest('/receptionist/check-ins', {
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

export const getReceptionistTickets = () =>
  apiRequest('/receptionist/tickets');

export const createReceptionistTicket = (data) =>
  apiRequest('/receptionist/tickets', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const replyReceptionistTicket = (ticketId, data) =>
  apiRequest(`/receptionist/tickets/${encodeURIComponent(ticketId)}/reply`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const enrollReceptionistClassMember = (sessionId, data) =>
  apiRequest(`/receptionist/classes/${encodeURIComponent(sessionId)}/enroll`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const cancelReceptionistClassBooking = (bookingId) =>
  apiRequest(`/receptionist/classes/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'DELETE',
  });
