import { useState, useCallback, useEffect, useRef } from 'react';
import { patientService } from '../services/patientService';
import { biomarkerService } from '../services/biomarkerService';
import { assessmentService } from '../services/assessmentService';

/**
 * Hook: usePatientData
 * Manages patient selection and patient-specific data fetching
 */
export const usePatientData = (initialPatientId = null) => {
  const [selectedPatient, setSelectedPatient] = useState(initialPatientId);
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectPatient = useCallback(async (patientId) => {
    setLoading(true);
    try {
      const patient = await patientService.getPatientById(patientId);
      setSelectedPatient(patientId);
      setPatientData(patient);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch patient');
      setPatientData(null);
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
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    if (!patientId) {
      setBiomarkers(null);
      return;
    }

    const fetchBiomarkers = async () => {
      setLoading(true);
      try {
        const biomarkerData = await biomarkerService.getBiomarkers(patientId);
        if (!cancelledRef.current) {
          setBiomarkers(biomarkerData);
          setLastFetched(new Date());
          setError(null);
        }
      } catch (err) {
        if (!cancelledRef.current) {
          setError(err.message || 'Failed to fetch biomarkers');
          setBiomarkers(null);
        }
      } finally {
        if (!cancelledRef.current) {
          setLoading(false);
        }
      }
    };

    fetchBiomarkers();

    return () => {
      cancelledRef.current = true;
    };
  }, [patientId]);

  const getStatus = useCallback((biomarkerKey) => {
    if (!biomarkers || !biomarkers[biomarkerKey]) return null;
    return biomarkerService.getStatus(biomarkers[biomarkerKey].value, biomarkerKey);
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
  const [lastFetched, setLastFetched] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    if (!patientId) {
      setAssessment(null);
      return;
    }

    const fetchAssessment = async () => {
      setLoading(true);
      try {
        const assessmentData = await assessmentService.getAssessment(patientId);
        if (!cancelledRef.current) {
          setAssessment(assessmentData);
          setLastFetched(new Date());
          setError(null);
        }
      } catch (err) {
        if (!cancelledRef.current) {
          setError(err.message || 'Failed to fetch assessment');
          setAssessment(null);
        }
      } finally {
        if (!cancelledRef.current) {
          setLoading(false);
        }
      }
    };

    fetchAssessment();

    return () => {
      cancelledRef.current = true;
    };
  }, [patientId]);

  return {
    assessment,
    loading,
    error,
    lastFetched
  };
};

/**
 * Hook: useSurgicalPlan
 * Fetches and manages surgical planning data
 */
export const useSurgicalPlan = (patientId) => {
  const [surgicalPlan, setSurgicalPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [hardwareSelection, setHardwareSelection] = useState({});
  const cancelledRef = useRef(false);

  const updateHardwareSelection = useCallback((id, selected) => {
    setHardwareSelection((prev) => ({ ...prev, [id]: selected }));
  }, []);

  useEffect(() => {
    cancelledRef.current = false;

    if (!patientId) {
      setSurgicalPlan(null);
      return;
    }

    const fetchSurgicalPlan = async () => {
      setLoading(true);
      try {
        const planData = await patientService.getSurgicalPlan(patientId);
        if (!cancelledRef.current) {
          setSurgicalPlan(planData);
          setLastFetched(new Date());
          setError(null);
        }
      } catch (err) {
        if (!cancelledRef.current) {
          setError(err.message || 'Failed to fetch surgical plan');
          setSurgicalPlan(null);
        }
      } finally {
        if (!cancelledRef.current) {
          setLoading(false);
        }
      }
    };

    fetchSurgicalPlan();

    return () => {
      cancelledRef.current = true;
    };
  }, [patientId]);

  return {
    plan: surgicalPlan,
    surgicalPlan,
    loading,
    error,
    lastFetched,
    hardwareSelection,
    updateHardwareSelection,
  };
};

/**
 * Hook: useTrendingData
 * Fetches trending/historical biomarker data for a patient
 */
export const useTrendingData = (patientId) => {
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;

    if (!patientId) {
      setTrendData(null);
      return;
    }

    const fetchTrendData = async () => {
      setLoading(true);
      try {
        const data = await biomarkerService.getTrendingData(patientId);
        if (!cancelledRef.current) {
          setTrendData(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelledRef.current) {
          setError(err.message || 'Failed to fetch trending data');
          setTrendData(null);
        }
      } finally {
        if (!cancelledRef.current) {
          setLoading(false);
        }
      }
    };

    fetchTrendData();

    return () => {
      cancelledRef.current = true;
    };
  }, [patientId]);

  return {
    trendData,
    loading,
    error
  };
};

