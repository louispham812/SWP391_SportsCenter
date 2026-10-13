import { apiRequest } from './apiClient';

export const sendMemberAssistantMessages = (messages) =>
  apiRequest('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ messages }),
  });

export const generateCoachPlan = (bookingId, goal = '') =>
  apiRequest('/ai/coach-plan', {
    method: 'POST',
    body: JSON.stringify({ bookingId, goal }),
  });
