import { apiRequest } from './apiClient';

const notifyNotificationsUpdated = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('sporthub:notifications-updated'));
  }
};

// Thông báo in-app (MEM-25, COA-16)
export const getNotifications = () => apiRequest('/notifications');
export const markNotificationRead = async (id) => {
  const result = await apiRequest(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' });
  notifyNotificationsUpdated();
  return result;
};
export const markAllNotificationsRead = async () => {
  const result = await apiRequest('/notifications/read-all', { method: 'POST' });
  notifyNotificationsUpdated();
  return result;
};

// Đánh giá HLV / lớp học (MEM-27, COA-15)
export const getEligibleFeedbackSessions = () => apiRequest('/feedbacks/eligible');
export const submitFeedback = (data) =>
  apiRequest('/feedbacks', { method: 'POST', body: JSON.stringify(data) });
export const getMyCoachFeedbacks = () => apiRequest('/feedbacks/coach/me');

// Manager: broadcast (MGR-20), audit log (MGR-14), bảo trì sân (MGR-19), settings (MGR-02/15)
export const sendBroadcast = (data) =>
  apiRequest('/manager/broadcast', { method: 'POST', body: JSON.stringify(data) });
export const getAuditLogs = () => apiRequest('/manager/audit-logs');

export const getMaintenanceList = () => apiRequest('/manager/maintenance');
export const createMaintenance = (data) =>
  apiRequest('/manager/maintenance', { method: 'POST', body: JSON.stringify(data) });
export const extendMaintenance = (id, data) =>
  apiRequest(`/manager/maintenance/${encodeURIComponent(id)}/extend`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const deleteMaintenance = (id) =>
  apiRequest(`/manager/maintenance/${encodeURIComponent(id)}`, { method: 'DELETE' });
export const getSystemSettings = () => apiRequest('/manager/settings');
export const updateSystemSettings = (data) =>
  apiRequest('/manager/settings', { method: 'PUT', body: JSON.stringify(data) });
