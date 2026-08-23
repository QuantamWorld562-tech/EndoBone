import apiClient from './apiClient';
import {
  referenceRanges,
  getBiomarkersByPatientId,
  getTrendingData,
  getReferenceRange,
  getBiomarkerStatus,
} from '../data/mockData';

export const biomarkerService = {
  getBiomarkers: async (patientId) => {
    try {
      const response = await apiClient.get(`/cases/${patientId}/full`);
      if (response.data?.biomarker) {
        const b = response.data.biomarker;
        return {
          pth: { value: b.pth ?? '', unit: 'pg/mL', ref: '15.0–65.0', status: (b.pth > 65 ? 'elevated' : b.pth < 15 && b.pth !== '' ? 'low' : 'normal') },
          vitaminD: { value: b.vitamin_d ?? '', unit: 'ng/mL', ref: '30.0–100.0', status: (b.vitamin_d < 20 && b.vitamin_d !== '' ? 'deficient' : b.vitamin_d < 30 && b.vitamin_d !== '' ? 'low' : 'normal') },
          calcium: { value: b.calcium ?? '', unit: 'mg/dL', ref: '8.6–10.3', status: (b.calcium < 8.6 && b.calcium !== '' ? 'low' : b.calcium > 10.3 ? 'elevated' : 'normal') },
          phosphate: { value: b.phosphate ?? '', unit: 'mg/dL', ref: '2.5–4.5', status: (b.phosphate < 2.5 && b.phosphate !== '' ? 'low' : b.phosphate > 4.5 ? 'elevated' : 'normal') },
          alp: { value: b.alp ?? '', unit: 'U/L', ref: '44–147', status: (b.alp > 147 ? 'elevated' : 'normal') },
          tsh: { value: b.tsh ?? 1.8, unit: 'mIU/L', ref: '0.4–4.0', status: 'normal' },
          free_t4: { value: b.free_t4 ?? 1.1, unit: 'ng/dL', ref: '0.8–1.8', status: 'normal' },
          ctx: { value: b.ctx ?? '', unit: 'pg/mL', ref: '< 300', status: (b.ctx > 300 ? 'elevated' : 'normal') },
        };
      }
    } catch {
      // Fallback
    }
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
