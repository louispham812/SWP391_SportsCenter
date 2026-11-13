export const ROLE_HOME_PATHS = {
  member: '/member',
  receptionist: '/receptionist',
  coach: '/coach',
  admin: '/admin',
};

export function getPortalHomePath(role, fallback = '/') {
  return ROLE_HOME_PATHS[role] || fallback;
}
