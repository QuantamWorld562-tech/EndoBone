import apiClient from './apiClient';

/**
 * Admin Service - API calls for Administrator functions
 * Passwords are encrypted and NEVER accessible via any admin endpoints.
 */

export async function getAdminStats() {
  const response = await apiClient.get('/admin/stats');
  return response.data;
}

export async function getAdminUsers() {
  const response = await apiClient.get('/admin/users');
  return response.data;
}

export async function getAdminUser(userId) {
  const response = await apiClient.get(`/admin/users/${userId}`);
  return response.data;
}

export async function updateAdminUser(userId, payload) {
  const response = await apiClient.put(`/admin/users/${userId}`, payload);
  return response.data;
}

export async function deleteAdminUser(userId) {
  const response = await apiClient.delete(`/admin/users/${userId}`);
  return response.data;
}

export async function getAdminPatients() {
  const response = await apiClient.get('/admin/patients');
  return response.data;
}

export async function getAdminPatient(caseId) {
  const response = await apiClient.get(`/admin/patients/${caseId}`);
  return response.data;
}

export async function updateAdminPatient(caseId, payload) {
  const response = await apiClient.put(`/admin/patients/${caseId}`, payload);
  return response.data;
}
