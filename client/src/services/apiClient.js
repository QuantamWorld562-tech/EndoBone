import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || '';
const baseURL = rawUrl ? (rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`) : '/api';

const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

export default apiClient;
