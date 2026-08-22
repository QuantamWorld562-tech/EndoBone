import {
  getAssessmentByPatientId,
  getRegionalAnalysis,
} from '../data/mockData';
import apiClient from './apiClient';
import { toApiBiomarkers, toUiAssessment } from './apiAdapters';

export const assessmentService = {
  getAssessment: async (patientId) => {
    return getAssessmentByPatientId(patientId);
  },

  getRegionalAnalysis: async (patientId, region) => {
    return getRegionalAnalysis(patientId, region);
  },

  analyze: async (patientId, biomarkers) => {
    const response = await apiClient.post('/assessments/analyze', {
      patientId,
      biomarkers: toApiBiomarkers(biomarkers),
    });
    return toUiAssessment(response.data);
  },

  updateNotes: async (assessmentId, planningNotes, selectedRoi) => {
    const response = await apiClient.put(`/assessments/${assessmentId}/notes`, {
      planning_notes: planningNotes,
      selected_roi: selectedRoi,
    });
    return toUiAssessment(response.data);
  },
};
