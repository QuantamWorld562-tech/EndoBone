import {
  getPatientById,
  getAllPatients,
  getSurgicalPlan,
} from '../data/mockData';
import apiClient from './apiClient';
import { toUiPatient } from './apiAdapters';

export const patientService = {
  getPatients: async () => {
    return getAllPatients();
  },

  getPatientById: async (patientId) => {
    const response = await apiClient.get(`/cases/${patientId}`);
    return toUiPatient(response.data);
  },

  createPatient: async (patient) => {
    const response = await apiClient.post('/cases', patient);
    return toUiPatient(response.data);
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
