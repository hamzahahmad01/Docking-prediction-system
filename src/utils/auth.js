import { apiRequest } from './api.js';

const AUTH_STORAGE_KEY = 'docking_prediction_auth';

export async function authenticateEmployee(employeeId, password) {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      employeeId,
      password,
    }),
  });

  return response;
}

export function saveAuthSession(employee, token) {
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      employee,
      token,
    }),
  );
}

export function getStoredAuthSession() {
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export async function logoutEmployee() {
  try {
    await apiRequest('/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    // Session may already be gone on the server; local cleanup still matters.
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
