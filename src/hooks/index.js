import { useState, useCallback, useEffect } from 'react';
import {
  getBiomarkersByPatientId,
  getAssessmentByPatientId,
  getRegionalAnalysis,
  getSurgicalPlan,
  getTrendingData,
  getPatientById,
  getAllPatients,
  getBiomarkerStatus
} from '../data/mockData';

/**
 * Hook: usePatientData
 * Manages patient selection and patient-specific data fetching
 */
export const usePatientData = (initialPatientId = null) => {
  const [selectedPatient, setSelectedPatient] = useState(initialPatientId);
  const [patientData, setPatientData] = useState(() => initialPatientId ? getPatientById(initialPatientId) : null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectPatient = useCallback((patientId) => {
    setLoading(true);
    try {
      const data = getPatientById(patientId);
      if (data) {
        setSelectedPatient(patientId);
        setPatientData(data);
        setError(null);
      } else {
        setError('Patient not found');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialPatientId) {
      selectPatient(initialPatientId);
    }
  }, [initialPatientId, selectPatient]);

  return {
    patient: patientData,
    selectedPatient,
    patientData,
    loading,
    error,
    selectPatient
  };
};

/**
 * Hook: useBiomarkers
 * Fetches and manages biomarker data for a patient
 */
export const useBiomarkers = (patientId) => {
  const [biomarkers, setBiomarkers] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  useEffect(() => {
    if (!patientId) {
      setBiomarkers(null);
      return;
    }

    setLoading(true);
    try {
      const data = getBiomarkersByPatientId(patientId);
      if (data) {
        setBiomarkers(data);
        setLastFetched(new Date());
        setError(null);
      } else {
        setError('No biomarkers found for this patient');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const getStatus = useCallback((biomarkerKey) => {
    if (!biomarkers || !biomarkers[biomarkerKey]) return null;
    const value = biomarkers[biomarkerKey].value;
    return getBiomarkerStatus(value, biomarkerKey);
  }, [biomarkers]);

  const getAbnormalBiomarkers = useCallback(() => {
    if (!biomarkers) return [];
    return Object.entries(biomarkers)
      .filter(([_, data]) => data.status !== 'normal')
      .map(([key, data]) => ({ key, ...data }));
  }, [biomarkers]);

  return {
    biomarkers,
    loading,
    error,
    lastFetched,
    getStatus,
    getAbnormalBiomarkers
  };
};

/**
 * Hook: useAssessment
 * Fetches and manages AI assessment results for a patient
 */
export const useAssessment = (patientId) => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) {
      setAssessment(null);
      return;
    }

    setLoading(true);
    try {
      const data = getAssessmentByPatientId(patientId);
      if (data) {
        setAssessment(data);
        setError(null);
      } else {
        setError('No assessment found for this patient');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const getRiskCategory = useCallback((riskScore) => {
    if (riskScore >= 70) return { label: 'HIGH', color: 'red', className: 'bg-red-100 text-red-700' };
    if (riskScore >= 40) return { label: 'MODERATE', color: 'amber', className: 'bg-amber-100 text-amber-700' };
    return { label: 'LOW', color: 'teal', className: 'bg-teal-100 text-teal-700' };
  }, []);

  const getSeverityBadge = useCallback((severity) => {
    const badges = {
      high: { label: 'Critical Alert', className: 'bg-red-100 text-red-700 border-l-4 border-red-600' },
      moderate: { label: 'Important', className: 'bg-amber-100 text-amber-700 border-l-4 border-amber-600' },
      low: { label: 'Note', className: 'bg-blue-100 text-blue-700 border-l-4 border-blue-600' }
    };
    return badges[severity] || badges.low;
  }, []);

  return {
    assessment,
    loading,
    error,
    getRiskCategory,
    getSeverityBadge
  };
};

/**
 * Hook: useRegionalAnalysis
 * Manages region selection and related analysis data
 */
export const useRegionalAnalysis = (patientId, initialRegion = 'proximal-femur') => {
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);
  const [regionData, setRegionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId || !selectedRegion) return;

    setLoading(true);
    try {
      const data = getRegionalAnalysis(patientId, selectedRegion);
      if (data) {
        setRegionData(data);
        setError(null);
      } else {
        setError('No data found for this region');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId, selectedRegion]);

  const selectRegion = useCallback((region) => {
    setSelectedRegion(region);
  }, []);

  return {
    selectedRegion,
    regionData,
    loading,
    error,
    selectRegion
  };
};

/**
 * Hook: useSurgicalPlan
 * Fetches and manages surgical planning data
 */
export const useSurgicalPlan = (patientId) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hardwareSelection, setHardwareSelection] = useState({});

  useEffect(() => {
    if (!patientId) {
      setPlan(null);
      return;
    }

    setLoading(true);
    try {
      const data = getSurgicalPlan(patientId);
      if (data) {
        setPlan(data);
        if (data.hardware) {
          setHardwareSelection(
            Object.entries(data.hardware).reduce((acc, [key, value]) => {
              if (typeof value === 'boolean') acc[key] = value;
              return acc;
            }, {})
          );
        }
        setError(null);
      } else {
        setError('No surgical plan found for this patient');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const updateHardwareSelection = useCallback((key, value) => {
    setHardwareSelection(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const getRiskLevel = useCallback((riskFactor) => {
    const level = riskFactor?.level || 'UNKNOWN';
    const colors = {
      'HIGH': 'text-red-600 bg-red-50',
      'MODERATE': 'text-amber-600 bg-amber-50',
      'LOW': 'text-teal-600 bg-teal-50'
    };
    return colors[level] || colors.LOW;
  }, []);

  return {
    plan,
    loading,
    error,
    hardwareSelection,
    updateHardwareSelection,
    getRiskLevel
  };
};

/**
 * Hook: useTrendingData
 * Manages historical biomarker trending data
 */
export const useTrendingData = (patientId) => {
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!patientId) {
      setTrendData(null);
      return;
    }

    setLoading(true);
    try {
      const data = getTrendingData(patientId);
      if (data) {
        setTrendData(data);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  const getTrendDirection = useCallback((trend) => {
    const directions = {
      'up': { icon: '↑', color: 'text-red-600', label: 'Rising' },
      'down': { icon: '↓', color: 'text-blue-600', label: 'Declining' },
      'stable': { icon: '→', color: 'text-teal-600', label: 'Stable' }
    };
    return directions[trend] || directions.stable;
  }, []);

  return {
    trendData,
    loading,
    error,
    getTrendDirection
  };
};

/**
 * Hook: usePatientList
 * Manages patient list with filtering and search
 */
export const usePatientList = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    try {
      const data = getAllPatients();
      setPatients(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let filtered = patients;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.id.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        p.mrn.toLowerCase().includes(term) ||
        p.procedure?.toLowerCase().includes(term) ||
        p.clinician?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    setFilteredPatients(filtered);
  }, [patients, searchTerm, statusFilter]);

  return {
    patients,
    filteredPatients,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    loading
  };
};

/**
 * Hook: useNavigationState
 */
export const useNavigationState = (initialView = 'landing') => {
  const [currentView, setCurrentView] = useState(initialView);
  const [viewHistory, setViewHistory] = useState([initialView]);
  const [viewData, setViewData] = useState({});

  const navigateTo = useCallback((view, data = null) => {
    setCurrentView(view);
    setViewHistory(prev => [...prev, view]);
    if (data) {
      setViewData(prev => ({
        ...prev,
        [view]: data
      }));
    }
  }, []);

  const goBack = useCallback(() => {
    if (viewHistory.length > 1) {
      const newHistory = viewHistory.slice(0, -1);
      setViewHistory(newHistory);
      setCurrentView(newHistory[newHistory.length - 1]);
    }
  }, [viewHistory]);

  const getViewData = useCallback((view) => {
    return viewData[view] || null;
  }, [viewData]);

  return {
    currentView,
    viewHistory,
    navigateTo,
    goBack,
    getViewData,
    canGoBack: viewHistory.length > 1
  };
};

/**
 * Hook: useDataCache
 */
export const useDataCache = () => {
  const [cache, setCache] = useState({});

  const getCached = useCallback((key) => {
    return cache[key]?.data || null;
  }, [cache]);

  const setCached = useCallback((key, data, ttl = 300000) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now(),
        ttl
      }
    }));
  }, []);

  const isCacheValid = useCallback((key) => {
    const item = cache[key];
    if (!item) return false;
    return Date.now() - item.timestamp < item.ttl;
  }, [cache]);

  const clearCache = useCallback((key) => {
    setCache(prev => {
      const newCache = { ...prev };
      delete newCache[key];
      return newCache;
    });
  }, []);

  const clearAllCache = useCallback(() => {
    setCache({});
  }, []);

  return {
    getCached,
    setCached,
    isCacheValid,
    clearCache,
    clearAllCache
  };
};

/**
 * Hook: useFormState
 */
export const useFormState = (initialState = {}) => {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = useCallback((fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  }, [errors]);

  const markTouched = useCallback((fieldName) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));
  }, []);

  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialState);
    setErrors({});
    setTouched({});
  }, [initialState]);

  const submitForm = useCallback(async (onSubmit) => {
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  return {
    formData,
    errors,
    touched,
    isSubmitting,
    updateField,
    markTouched,
    setFieldError,
    resetForm,
    submitForm
  };
};
