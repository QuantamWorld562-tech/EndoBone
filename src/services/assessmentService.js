import {
  getAssessmentByPatientId,
  getRegionalAnalysis,
} from '../data/mockData';

export const assessmentService = {
  getAssessment: async (patientId) => {
    return getAssessmentByPatientId(patientId);
  },

  getRegionalAnalysis: async (patientId, region) => {
    return getRegionalAnalysis(patientId, region);
  },
};
