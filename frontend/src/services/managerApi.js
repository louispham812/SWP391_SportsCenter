import { apiRequest } from './apiClient';

export const getPendingStaffRegistrations = () =>
  apiRequest('/manager/staff-registrations');

export const approveStaffRegistration = (userId) =>
  apiRequest(`/manager/staff-registrations/${userId}/approve`, { method: 'PATCH' });

export const rejectStaffRegistration = (userId) =>
  apiRequest(`/manager/staff-registrations/${userId}/reject`, { method: 'PATCH' });

export const getManagerMembers = ({ query = '', status = '', page = 0, size = 12 }) => {
  const params = new URLSearchParams({
    query,
    page: String(page),
    size: String(size),
  });
  if (status) params.set('status', status);
  return apiRequest(`/manager/members?${params}`);
};

export const lockManagerMember = (userId) =>
  apiRequest(`/manager/members/${userId}/lock`, { method: 'PATCH' });

export const unlockManagerMember = (userId) =>
  apiRequest(`/manager/members/${userId}/unlock`, { method: 'PATCH' });

export const getManagerPackages = () => apiRequest('/manager/packages');

export const getManagerSports = () => apiRequest('/manager/sports');

export const getManagerFacilities = () => apiRequest('/manager/facilities');

export const getManagerDomainSports = () => apiRequest('/manager/domain-sports');

export const getManagerCoaches = () =>
  apiRequest('/manager/users?role=COACH&page=0&size=50');

export const updateManagerFacilityStatus = (facilityId, status) =>
  apiRequest(`/manager/facilities/${facilityId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const createManagerClassSession = (session) =>
  apiRequest('/manager/class-sessions', {
    method: 'POST',
    body: JSON.stringify(session),
  });

export const createManagerPackage = (membershipPackage) =>
  apiRequest('/manager/packages', {
    method: 'POST',
    body: JSON.stringify(membershipPackage),
  });

export const updateManagerPackage = (packageId, membershipPackage) =>
  apiRequest(`/manager/packages/${packageId}`, {
    method: 'PUT',
    body: JSON.stringify(membershipPackage),
  });

export const updateManagerPackageStatus = (packageId, status) =>
  apiRequest(`/manager/packages/${packageId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

export const createManagerUser = (userData) =>
  apiRequest('/manager/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

