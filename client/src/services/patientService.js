import {
  getPatientById,
  getAllPatients,
  getSurgicalPlan,
} from '../data/mockData';
import apiClient from './apiClient';
import { toUiPatient } from './apiAdapters';

export const patientService = {
  getPatients: async () => {
    try {
      const response = await apiClient.get('/cases');
      return response.data.cases.map(toUiPatient);
    } catch (e) {
      console.warn("Backend cases not found or empty, falling back to mock data.");
      return getAllPatients();
    }
  },

  getPatientById: async (patientId) => {
    try {
      const response = await apiClient.get(`/cases/${patientId}`);
      return toUiPatient(response.data);
    } catch (e) {
      console.warn(`Backend case ${patientId} not found, falling back to mock data.`);
      return getPatientById(patientId);
    }
  },

  createPatient: async (patient) => {
    try {
      const response = await apiClient.post('/cases', patient);
      return toUiPatient(response.data);
    } catch (e) {
      console.error("Failed to create patient on backend.");
      throw e;
    }
  },

  deletePatient: async (patientId) => {
    try {
      const response = await apiClient.delete(`/cases/${patientId}`);
      return response.data;
    } catch (e) {
      console.warn(`Backend case ${patientId} delete failed, applying local delete.`);
      return { success: true, id: patientId };
    }
  },

  updatePatient: async (patientId, updates) => {
    try {
      const response = await apiClient.patch(`/cases/${patientId}`, updates);
      return toUiPatient(response.data);
    } catch (e) {
      console.warn(`Backend case ${patientId} update failed, falling back to local update:`, e);
      return { id: patientId, ...updates };
    }
  },

  filterPatients: (patientList, { searchTerm = '', statusFilter = 'all' } = {}) => {
    let result = [...patientList];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.mrn.toLowerCase().includes(term) ||
          p.id.toLowerCase().includes(term) ||
          p.procedure.toLowerCase().includes(term)
      );
    }

    if (statusFilter && statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    return result;
  },

  getSurgicalPlan: async (patientId) => {
    return getSurgicalPlan(patientId);
  },
};
