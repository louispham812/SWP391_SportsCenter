import { apiRequest } from './apiClient';

// Thông báo in-app (MEM-25, COA-16)
export const getNotifications = () => apiRequest('/notifications');
export const markNotificationRead = (id) => apiRequest(`/notifications/${id}/read`, { method: 'POST' });
export const markAllNotificationsRead = () => apiRequest('/notifications/read-all', { method: 'POST' });

// Đánh giá HLV / lớp học (MEM-27, COA-15)
export const getEligibleFeedbackSessions = () => apiRequest('/feedbacks/eligible');
export const submitFeedback = (data) =>
  apiRequest('/feedbacks', { method: 'POST', body: JSON.stringify(data) });
export const getMyCoachFeedbacks = () => apiRequest('/feedbacks/coach/me');

// Manager: broadcast (MGR-20), audit log (MGR-14), bảo trì sân (MGR-19)
export const sendBroadcast = (data) =>
  apiRequest('/manager/broadcast', { method: 'POST', body: JSON.stringify(data) });
export const getAuditLogs = () => apiRequest('/manager/audit-logs');
export const getMaintenanceList = () => apiRequest('/manager/maintenance');
export const createMaintenance = (data) =>
  apiRequest('/manager/maintenance', { method: 'POST', body: JSON.stringify(data) });
export const deleteMaintenance = (id) => apiRequest(`/manager/maintenance/${id}`, { method: 'DELETE' });
