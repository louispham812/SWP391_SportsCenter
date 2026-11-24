const ROLE_HOME_PATHS = {
  member: '/member',
  receptionist: '/receptionist',
  coach: '/coach',
  admin: '/admin',
};

const ROLE_PROFILE_LINKS = {
  member: { label: 'Hồ sơ & Thẻ số cá nhân', path: '/member/profile', icon: 'account_circle' },
  coach: { label: 'Hồ sơ cá nhân', path: '/coach/profile', icon: 'account_circle' },
  receptionist: { label: 'Hồ sơ cá nhân', path: '/receptionist/profile', icon: 'account_circle' },
  admin: { label: 'Quản trị & Phân quyền', path: '/admin/settings', icon: 'settings' },
};

export function getPortalHomePath(role, fallback = '/') {
  return ROLE_HOME_PATHS[role] || fallback;
}

export function getRoleProfileLink(role, fallbackPath = '/') {
  return ROLE_PROFILE_LINKS[role] || { label: 'Tài khoản cá nhân', path: fallbackPath, icon: 'account_circle' };
}
