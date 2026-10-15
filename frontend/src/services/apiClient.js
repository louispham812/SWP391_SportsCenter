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
    const message = await response.text();
    throw new Error(message || `API request failed (${response.status}).`);
  }
  return response.status === 204 ? null : response.json();
}
