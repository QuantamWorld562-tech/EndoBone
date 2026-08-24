import apiClient from './apiClient';

const STORAGE_TOKEN_KEY = 'endobone_auth_token';
const STORAGE_DOCTOR_KEY = 'endobone_doctor_profile';

export async function loginDoctor(payload) {
  const response = await apiClient.post('/auth/login', payload);
  return response.data;
}

export async function registerDoctor(payload) {
  const response = await apiClient.post('/auth/register', payload);
  return response.data;
}

export function persistAuthSession(session) {
  if (!session?.token || !session?.doctor) return;
  localStorage.setItem(STORAGE_TOKEN_KEY, session.token);
  localStorage.setItem(STORAGE_DOCTOR_KEY, JSON.stringify(session.doctor));
  apiClient.defaults.headers.common.Authorization = `Bearer ${session.token}`;
}

export function clearAuthSession() {
  localStorage.removeItem(STORAGE_TOKEN_KEY);
  localStorage.removeItem(STORAGE_DOCTOR_KEY);
  delete apiClient.defaults.headers.common.Authorization;
}

export function hydrateAuthHeader() {
  const token = localStorage.getItem(STORAGE_TOKEN_KEY);
  if (token) apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  return token;
}

export function readStoredDoctorProfile() {
  const raw = localStorage.getItem(STORAGE_DOCTOR_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function changePassword(payload) {
  const response = await apiClient.put('/auth/change-password', payload);
  return response.data;
}

export function isAdmin() {
  const profile = readStoredDoctorProfile();
  return profile?.role === 'admin';
}

export function isProfessor() {
  const profile = readStoredDoctorProfile();
  return profile?.role === 'professor';
}

export function getUserRole() {
  const profile = readStoredDoctorProfile();
  return profile?.role || 'doctor';
}

export function readApiError(error, fallbackMessage) {
  const data = error?.response?.data;
  if (typeof data?.detail === 'string') return data.detail;
  if (Array.isArray(data?.detail) && data.detail[0]?.msg) return data.detail[0].msg;
  if (data?.error) return data.error;
  if (data?.message) return data.message;
  return fallbackMessage || 'An unexpected error occurred. Please try again.';
}

