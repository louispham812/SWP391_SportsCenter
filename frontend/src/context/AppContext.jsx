/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import { apiRequest } from '../services/apiClient';

const AppContext = createContext();
const AUTH_SESSION_KEY = 'sports-center-auth-session';
let idCounter = 0;

const getAuthSession = () => {
  try {
    const session = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY) || 'null');
    const validRoles = ['member', 'receptionist', 'coach', 'admin'];
    if (
      session?.user &&
      typeof session.user === 'object' &&
      typeof session.token === 'string' &&
      validRoles.includes(session.role)
    ) {
      return session;
    }
  } catch {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
  }
  return null;
};

export function AppProvider({ children }) {
  const [authSession, setAuthSession] = useState(getAuthSession);
  const [toasts, setToasts] = useState([]);
  const currentRole = authSession?.role || null;
  const currentUser = authSession?.user || null;

  const removeToast = (id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  const showToast = (title, message, type = 'success') => {
    idCounter += 1;
    const id = `toast_${Date.now()}_${idCounter}`;
    setToasts((current) => [...current, { id, title, message, type }]);
    setTimeout(() => removeToast(id), 4500);
  };

  const authenticateUser = (user, roleKey, token) => {
    const roleTitles = {
      member: 'Hội viên Thể thao',
      receptionist: 'Nhân viên Lễ tân',
      coach: 'Huấn luyện viên',
      admin: 'Giám đốc Trung tâm',
    };
    const session = {
      token,
      role: roleKey,
      user: {
        id: user.userId,
        name: user.fullName,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        status: user.status,
        roleTitle: roleTitles[roleKey],
        avatar: user.fullName
          .split(/\s+/)
          .map((part) => part[0])
          .slice(-2)
          .join('')
          .toUpperCase(),
      },
    };
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    setAuthSession(session);
    showToast('Đăng nhập thành công', `Xin chào ${user.fullName}!`);
  };

  const updateProfile = (profile) => {
    setAuthSession((previous) => {
      if (!previous) return previous;
      const session = {
        ...previous,
        user: {
          ...previous.user,
          name: profile.fullName,
          phone: profile.phone || '',
        },
      };
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      return session;
    });
  };

  const logout = () => {
    const token = authSession?.token;
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setAuthSession(null);
    if (token) {
      apiRequest('/auth/session', { method: 'DELETE', authToken: token }).catch((error) => {
        console.error('Không thể thu hồi phiên đăng nhập trên máy chủ:', error);
      });
    }
  };

  return (
    <AppContext.Provider value={{
      authSession,
      currentRole,
      currentUser,
      authenticateUser,
      updateProfile,
      logout,
      toasts,
      removeToast,
      showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
