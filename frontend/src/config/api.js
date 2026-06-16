import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/v1';

// localStorage keys — kept here so service layer and interceptor stay in sync.
export const STORAGE_KEYS = {
  accessToken: 'mc_access_token',
  refreshToken: 'mc_refresh_token',
  user: 'mc_user',
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach the access token to every outgoing request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.accessToken);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, try one refresh, then retry the original request once.
let isRefreshing = false;
let pendingQueue = [];

const flushQueue = (error, token = null) => {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  pendingQueue = [];
};

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Don't try to refresh the refresh endpoint itself.
    if (status !== 401 || original._retry || original.url?.includes('/auth/refresh-tokens')) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken);
    if (!refreshToken) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      })
        .then((newToken) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(`${BASE_URL}/auth/refresh-tokens`, { refreshToken });
      const { access, refresh } = res.data;
      localStorage.setItem(STORAGE_KEYS.accessToken, access.token);
      localStorage.setItem(STORAGE_KEYS.refreshToken, refresh.token);
      flushQueue(null, access.token);
      original.headers.Authorization = `Bearer ${access.token}`;
      return api(original);
    } catch (refreshErr) {
      flushQueue(refreshErr, null);
      localStorage.removeItem(STORAGE_KEYS.accessToken);
      localStorage.removeItem(STORAGE_KEYS.refreshToken);
      localStorage.removeItem(STORAGE_KEYS.user);
      window.location.href = '/';
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);
