import { api, STORAGE_KEYS } from '../../../config/api.js';

const persistSession = ({ user, tokens }) => {
  localStorage.setItem(STORAGE_KEYS.accessToken, tokens.access.token);
  localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refresh.token);
  localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
};

const clearSession = () => {
  localStorage.removeItem(STORAGE_KEYS.accessToken);
  localStorage.removeItem(STORAGE_KEYS.refreshToken);
  localStorage.removeItem(STORAGE_KEYS.user);
};

export const register = async ({ name, email, password, role }) => {
  const { data } = await api.post('/auth/register', { name, email, password, role });
  persistSession(data);
  return data;
};

export const login = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password });
  persistSession(data);
  return data;
};

export const logout = async () => {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
  try {
    if (refreshToken) await api.post('/auth/logout', { refreshToken });
  } catch (_) {
    // ignore — we still clear local state below
  }
  clearSession();
};

export const sendVerificationEmail = () =>
  api.post('/auth/send-verification-email').then((r) => r.data);

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email }).then((r) => r.data);

export const getStoredUser = () => {
  const raw = localStorage.getItem(STORAGE_KEYS.user);
  return raw ? JSON.parse(raw) : null;
};
