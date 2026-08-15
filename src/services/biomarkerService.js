import {
  referenceRanges,
  getBiomarkersByPatientId,
  getTrendingData,
  getReferenceRange,
  getBiomarkerStatus,
} from '../data/mockData';

export const biomarkerService = {
  getBiomarkers: async (patientId) => {
    return getBiomarkersByPatientId(patientId);
  },

  getTrendingData: async (patientId) => {
    return getTrendingData(patientId);
  },

  getReferenceRange: (key) => {
    return getReferenceRange(key);
  },

  getAllReferenceRanges: () => {
    return referenceRanges;
  },

  getStatus: (value, key) => {
    return getBiomarkerStatus(value, key);
  },
};
