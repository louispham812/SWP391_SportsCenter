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
    let message;
    try {
      // Try to parse error response as JSON first (Spring Boot error format)
      const errorData = await response.json();
      // Extract message from Spring Boot error response format
      message = errorData.message || errorData.error || `API request failed (${response.status}).`;
    } catch {
      // Fallback to plain text if JSON parsing fails
      message = await response.text() || `API request failed (${response.status}).`;
    }
    throw new Error(message);
  }
  return response.status === 204 ? null : response.json();
}
