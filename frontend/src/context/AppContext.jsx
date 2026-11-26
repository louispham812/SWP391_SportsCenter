/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  const toastTimersRef = useRef(new Map());
  const currentRole = authSession?.role || null;
  const currentUser = authSession?.user || null;

  const clearToastTimer = useCallback((id) => {
    const existing = toastTimersRef.current.get(id);
    if (existing) {
      window.clearTimeout(existing);
      toastTimersRef.current.delete(id);
    }
  }, []);

  const removeToast = useCallback((id) => {
    clearToastTimer(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, [clearToastTimer]);

  const scheduleToastRemoval = useCallback((id, delayMs = 4500) => {
    clearToastTimer(id);
    const timerId = window.setTimeout(() => {
      toastTimersRef.current.delete(id);
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, delayMs);
    toastTimersRef.current.set(id, timerId);
  }, [clearToastTimer]);

  const pauseToast = useCallback((id) => {
    clearToastTimer(id);
  }, [clearToastTimer]);

  const resumeToast = useCallback((id) => {
    scheduleToastRemoval(id, 3000);
  }, [scheduleToastRemoval]);

  useEffect(() => {
    const timers = toastTimersRef.current;
    return () => {
      timers.forEach((timerId) => window.clearTimeout(timerId));
      timers.clear();
    };
  }, []);

  const formatToastMessage = (rawMsg) => {
    if (!rawMsg) return '';
    if (typeof rawMsg !== 'string') return String(rawMsg);
    const trimmed = rawMsg.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.message) return parsed.message;
        if (parsed.status === 409) return 'Lịch tập hoặc đặt chỗ bị trùng khung giờ với lịch hiện có của bạn.';
        if (parsed.status === 400) return 'Dữ liệu yêu cầu không hợp lệ.';
        if (parsed.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        if (parsed.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
        if (parsed.status === 404) return 'Không tìm thấy dữ liệu yêu cầu.';
        if (parsed.error) return `Lỗi: ${parsed.error}`;
      } catch {
        // not json
      }
    }
    return trimmed;
  };

  const showToast = (titleOrObj, message, type = 'success') => {
    idCounter += 1;
    const id = `toast_${Date.now()}_${idCounter}`;
    const nextToast =
      typeof titleOrObj === 'object' && titleOrObj !== null
        ? {
            id,
            title: titleOrObj.title || '',
            message: formatToastMessage(titleOrObj.message || ''),
            type: titleOrObj.type || 'success',
          }
        : {
            id,
            title: titleOrObj || '',
            message: formatToastMessage(message || ''),
            type: type || 'success',
          };
    setToasts((current) => {
      if (current.length >= 4) {
        clearToastTimer(current[0].id);
      }
      return [...current.slice(-3), nextToast];
    });
    scheduleToastRemoval(id, 4500);
  };

  const authenticateUser = (user, roleKey, token) => {
    const roleTitles = {
      member: 'Hội viên Thể thao',
      receptionist: 'Nhân viên Lễ tân',
      coach: 'Huấn luyện viên',
      admin: 'Giám đốc Trung tâm',
    };
    const defaultInitials = (user.fullName || 'User')
      .split(/\s+/)
      .map((part) => part[0])
      .slice(-2)
      .join('')
      .toUpperCase();

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
        avatar: user.avatar || defaultInitials,
      },
    };
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    setAuthSession(session);
    showToast('Đăng nhập thành công', `Xin chào ${user.fullName}!`);
  };

  const updateProfile = (profile) => {
    setAuthSession((previous) => {
      if (!previous) return previous;
      const updatedUser = { ...previous.user };
      if (profile.fullName !== undefined) updatedUser.name = profile.fullName;
      if (profile.name !== undefined) updatedUser.name = profile.name;
      if (profile.phone !== undefined) updatedUser.phone = profile.phone;
      if (profile.avatar !== undefined) updatedUser.avatar = profile.avatar;
      const session = {
        ...previous,
        user: updatedUser,
      };
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      return session;
    });
  };

  const logout = () => {
    const token = authSession?.token;
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem('authToken');
    localStorage.removeItem('tempUserEmail');
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
      pauseToast,
      resumeToast,
      showToast,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
