import apiClient from './apiClient';

/**
 * Low-level API service.
 *
 * NOTE: The backend uses /api prefix (set in FastAPI's API_V1_STR).
 *       apiClient already has baseURL pointing to '/api' via the Vite proxy,
 *       so these paths are relative to /api.
 *
 * Backend routes:
 *   - /api/cases          (GET list, POST create, GET /:id, GET /:id/full)
 *   - /api/biomarkers     (GET list, POST create, PUT /:id)
 *   - /api/assess         (POST assess biomarkers)
 *   - /api/reference-ranges (GET reference ranges)
 *   - /api/models         (GET list, GET /:id, GET /:id/features, GET /:id/download)
 *   - /api/simulate       (POST biomechanical simulation)
 *   - /api/ai/clinical-synthesis (POST AI clinical report)
 *   - /api/health         (GET health check)
 *   - /api/system/status  (GET system status)
 */
export const apiService = {
  // Cases (patients)
  getAllPatients: async () => {
    const response = await apiClient.get('/cases');
    return response.data;
  },
  getPatientById: async (patientId) => {
    const response = await apiClient.get(`/cases/${patientId}`);
    return response.data;
  },
  getFullCase: async (caseId) => {
    const response = await apiClient.get(`/cases/${caseId}/full`);
    return response.data;
  },
  createPatient: async (patientData) => {
    const response = await apiClient.post('/cases', patientData);
    return response.data;
  },

  // Biomarkers
  getAllBiomarkers: async () => {
    const response = await apiClient.get('/biomarkers');
    return response.data;
  },
  createBiomarker: async (biomarkerData) => {
    const response = await apiClient.post('/biomarkers', biomarkerData);
    return response.data;
  },
  updateBiomarker: async (biomarkerId, biomarkerData) => {
    const response = await apiClient.put(`/biomarkers/${biomarkerId}`, biomarkerData);
    return response.data;
  },

  // Assessment (rule engine)
  assessBiomarkers: async (biomarkerInput) => {
    const response = await apiClient.post('/assess', biomarkerInput);
    return response.data;
  },
  getReferenceRanges: async () => {
    const response = await apiClient.get('/reference-ranges');
    return response.data;
  },

  // 3D Models
  getAllModels: async () => {
    const response = await apiClient.get('/models');
    return response.data;
  },
  getModelById: async (modelId) => {
    const response = await apiClient.get(`/models/${modelId}`);
    return response.data;
  },
  getModelFeatures: async (modelId) => {
    const response = await apiClient.get(`/models/${modelId}/features`);
    return response.data;
  },

  // Simulation & AI
  runSimulation: async (simulationData) => {
    const response = await apiClient.post('/simulate', simulationData);
    return response.data;
  },
  generateAiSynthesis: async (synthesisData) => {
    const response = await apiClient.post('/ai/clinical-synthesis', synthesisData);
    return response.data;
  },

  // Health
  getHealth: async () => {
    const response = await apiClient.get('/health');
    return response.data;
  },
  getSystemStatus: async () => {
    const response = await apiClient.get('/system/status');
    return response.data;
  },
};

export default apiService;