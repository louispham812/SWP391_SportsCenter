const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1')
  .replace(/\/$/, '');
const AUTH_SESSION_KEY = 'sports-center-auth-session';

export async function apiRequest(path, options = {}) {
  const { authToken, ...requestOptions } = options;
  const session = JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY) || 'null');
  const headers = new Headers(requestOptions.headers || {});
  const token = authToken || session?.token;
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (requestOptions.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...requestOptions, headers });
  if (!response.ok) {
    const rawText = await response.text();
    let message = '';
    try {
      const parsed = JSON.parse(rawText);
      message = parsed.message || parsed.error_description || parsed.detail || '';
      if (!message && parsed.error && parsed.error !== 'Conflict' && parsed.error !== 'Bad Request') {
        message = parsed.error;
      }
    } catch {
      message = rawText;
    }

    if (!message || message.trim() === '') {
      if (response.status === 409) {
        message = 'Lịch học hoặc đặt chỗ bị trùng khung giờ với lịch hiện có của bạn.';
      } else if (response.status === 400) {
        message = 'Thông tin gửi lên không hợp lệ.';
      } else if (response.status === 401) {
        message = 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (response.status === 403) {
        message = 'Bạn không có quyền thực hiện thao tác này.';
      } else if (response.status === 404) {
        message = 'Không tìm thấy dữ liệu yêu cầu.';
      } else {
        message = `Hệ thống gặp sự cố (${response.status}). Vui lòng thử lại sau ít phút.`;
      }
    }

    const err = new Error(message);
    err.status = response.status;
    err.raw = rawText;
    throw err;
  }
  return response.status === 204 ? null : response.json();
}
