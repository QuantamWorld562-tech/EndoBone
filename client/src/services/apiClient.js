import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || '';
const baseURL = rawUrl ? (rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`) : '/api';

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('endobone_auth_token');
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // localStorage may be inaccessible in certain environments
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/register')
    ) {
      console.warn('Session expired or unauthorized token detected.');
      try {
        localStorage.removeItem('endobone_auth_token');
        localStorage.removeItem('endobone_doctor_profile');
      } catch {
        // no-op
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
