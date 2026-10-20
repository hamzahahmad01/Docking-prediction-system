export const API_BASE_URL = 'http://localhost:5000';
const AUTH_STORAGE_KEY = 'docking_prediction_auth';
const AUTH_NOTICE_KEY = 'docking_prediction_auth_notice';

async function parseResponse(response, { token } = {}) {
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? body.message
        : 'Request failed.';

    const isExpiredSession =
      response.status === 401 &&
      Boolean(token) &&
      (message === 'Session is invalid or expired.' || message === 'Authentication required.');

    if (isExpiredSession) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      window.sessionStorage.setItem(
        AUTH_NOTICE_KEY,
        'Your session expired after the server restarted. Please login again.',
      );

      if (window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
    }

    throw new Error(message);
  }

  return body;
}

export async function apiRequest(path, options = {}) {
  const storedSession = window.localStorage.getItem(AUTH_STORAGE_KEY);
  const parsedSession = storedSession ? JSON.parse(storedSession) : null;
  const token = parsedSession?.token || '';
  const isFormData = options.body instanceof FormData;
  const customHeaders = options.headers || {};

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    ...options,
  });

  const refreshedToken = response.headers.get('X-Refreshed-Token');

  if (refreshedToken && parsedSession) {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ ...parsedSession, token: refreshedToken }),
    );
  }

  return parseResponse(response, { token });
}

export function consumeAuthNotice() {
  const notice = window.sessionStorage.getItem(AUTH_NOTICE_KEY);

  if (!notice) {
    return '';
  }

  window.sessionStorage.removeItem(AUTH_NOTICE_KEY);
  return notice;
}
