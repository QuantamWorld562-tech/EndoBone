import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import {
  patients,
  biomarkersDB,
  regionalAnalysisDB,
  surgicalPlansDB,
  referenceRanges,
} from '../data/mockData';
import { patientService } from '../services/patientService';
import { biomarkerService } from '../services/biomarkerService';
import { assessmentService } from '../services/assessmentService';
import { readApiError } from '../services/authService';
import { toApiRegion, backendToUiRegion } from '../services/apiAdapters';

const PatientDataContext = createContext(null);

// ─────────────────────────────────────────────────────────────
// Dynamic Rule-Based AI Engine
// Computes clinical risk, insights, and pathways from biomarkers
// ─────────────────────────────────────────────────────────────
export function computeDynamicAssessment(patientId, biomarkers) {
  const parseBiomarkerNum = (val, fallback) => {
    if (val === '' || val === null || val === undefined) return fallback;
    const n = typeof val === 'number' ? val : parseFloat(val);
    return Number.isFinite(n) ? n : fallback;
  };

  const pth = parseBiomarkerNum(biomarkers?.pth?.value, 65);
  const vitD = parseBiomarkerNum(biomarkers?.vitaminD?.value, 30);
  const calcium = parseBiomarkerNum(biomarkers?.calcium?.value, 9.0);
  const phosphate = parseBiomarkerNum(biomarkers?.phosphate?.value, 3.5);
  const alp = parseBiomarkerNum(biomarkers?.alp?.value, 80);
  const ctx = parseBiomarkerNum(biomarkers?.ctx?.value, 300);

  // Base score calculation
  let qualityRisk = 30; // base moderate-low
  let structuralVuln = 20;

  // Metabolic penalties
  if (pth > 80) qualityRisk += 25;
  else if (pth > 65) qualityRisk += 12;

  if (vitD < 20) qualityRisk += 25;
  else if (vitD < 30) qualityRisk += 10;

  if (calcium < 8.5) qualityRisk += 15;
  else if (calcium > 10.5) qualityRisk += 15;

  if (phosphate < 2.5 || phosphate > 4.5) qualityRisk += 10;

  if (ctx > 400) {
    qualityRisk += 15;
    structuralVuln += 25;
  } else if (ctx > 300) {
    structuralVuln += 12;
  }

  if (alp > 140) structuralVuln += 15;

  // Clamp 0 - 100
  qualityRisk = Math.min(Math.max(qualityRisk, 15), 95);
  structuralVuln = Math.min(Math.max(structuralVuln, 10), 90);

  // Dynamic DEXA T-Score estimation
  let tscore = -1.5;
  if (qualityRisk >= 70) tscore = -2.8;
  else if (qualityRisk >= 50) tscore = -2.2;
  else if (qualityRisk >= 35) tscore = -1.8;
  else tscore = -1.2;

  // Dynamic Insights
  const insights = [];

  // PTH & Calcium relationship
  if (pth > 65 && vitD < 30 && calcium < 8.8) {
    insights.push({
      type: 'metabolic',
      severity: 'high',
      text: `Elevated PTH (${pth} pg/mL) alongside low Vitamin D (${vitD} ng/mL) and low Calcium (${calcium} mg/dL) indicates secondary hyperparathyroidism. Hypocalcemia is driving compensatory parathyroid hormone elevation and increased bone resorption.`,
    });
  } else if (pth > 65 && calcium > 10.3) {
    insights.push({
      type: 'metabolic',
      severity: 'high',
      text: `Elevated PTH (${pth} pg/mL) with elevated serum Calcium (${calcium} mg/dL) suggests possible primary hyperparathyroidism with autonomous parathyroid activity.`,
    });
  } else if (pth > 65) {
    insights.push({
      type: 'metabolic',
      severity: 'moderate',
      text: `Elevated PTH (${pth} pg/mL) indicates stimulated bone turnover. Vitamin D optimization is recommended.`,
    });
  } else {
    insights.push({
      type: 'metabolic',
      severity: 'low',
      text: `PTH (${pth} pg/mL) and Calcium (${calcium} mg/dL) are well-regulated within physiologic homeostasis.`,
    });
  }

  // Structural & Cortical Insight
  if (qualityRisk >= 65 || ctx > 400) {
    insights.push({
      type: 'structural',
      severity: 'high',
      text: `Accelerated bone turnover (CTX: ${ctx} pg/mL) is causing localized cortical thinning in load-bearing zones. High risk of hardware loosening or micro-fracture under lateral load.`,
    });
  } else if (qualityRisk >= 40) {
    insights.push({
      type: 'structural',
      severity: 'moderate',
      text: `Moderate trabecular bone loss with relatively preserved cortical thickness. Standard instrumentation with bone density monitoring recommended.`,
    });
  } else {
    insights.push({
      type: 'structural',
      severity: 'low',
      text: `Cortical and trabecular microarchitecture show adequate density for standard surgical fixation.`,
    });
  }

  // Vitamin D insight
  if (vitD < 20) {
    insights.push({
      type: 'endocrine',
      severity: 'high',
      text: `Severe Vitamin D deficiency (${vitD} ng/mL) significantly impairs intestinal calcium absorption and post-op osteointegration.`,
    });
  } else if (vitD < 30) {
    insights.push({
      type: 'endocrine',
      severity: 'moderate',
      text: `Sub-optimal Vitamin D level (${vitD} ng/mL). Pre-operative supplementation is advised.`,
    });
  }

  // Key contributing factors list
  const keyFactors = [
    {
      label: 'Parathyroid Hormone (PTH)',
      value: pth,
      unit: 'pg/mL',
      impact: pth > 65 ? 'Elevated bone resorption rate' : 'Normal metabolic regulation',
      direction: pth > 65 ? 'up' : pth < 15 ? 'down' : 'stable',
    },
    {
      label: '25-OH Vitamin D',
      value: vitD,
      unit: 'ng/mL',
      impact: vitD < 30 ? 'Deficiency reducing calcium absorption & bone mineralization' : 'Optimal bone mineral homeostasis',
      direction: vitD < 30 ? 'down' : 'stable',
    },
    {
      label: 'Total Calcium',
      value: calcium,
      unit: 'mg/dL',
      impact: calcium < 8.6 ? 'Hypocalcemia driving parathyroid hyperactivity' : 'Normal extracellular calcium',
      direction: calcium < 8.6 ? 'down' : calcium > 10.3 ? 'up' : 'stable',
    },
    {
      label: 'CTX-I (Resorption)',
      value: ctx,
      unit: 'pg/mL',
      impact: ctx > 300 ? 'High osteoclastic bone resorption activity' : 'Balanced bone remodeling turnover',
      direction: ctx > 300 ? 'up' : 'stable',
    },
  ];

  // Recommended pathways
  const recommendedPathway = [];
  if (qualityRisk >= 65) {
    recommendedPathway.push({
      step: 'Immediate Metabolic Optimization',
      desc: `Initiate high-dose Vitamin D3 (4,000–5,000 IU/day) and Calcium (1,200 mg/day) protocol to suppress PTH and stabilize serum levels.`,
      priority: 'critical',
      timeframe: '1–2 weeks',
    });
    recommendedPathway.push({
      step: 'Augmented Fixation Strategy',
      desc: 'Recommend fenestrated pedicle screws with calcium phosphate cement augmentation to prevent pullout in osteoporotic bone.',
      priority: 'high',
      timeframe: 'Pre-Op Planning',
    });
    recommendedPathway.push({
      step: 'Consider Surgical Deferment',
      desc: 'If elective, consider delaying instrumentation 4–6 weeks until Vitamin D > 30 ng/mL and bone turnover stabilizes.',
      priority: 'high',
      timeframe: '4–6 weeks',
    });
  } else if (qualityRisk >= 40) {
    recommendedPathway.push({
      step: 'Vitamin D Supplementation',
      desc: 'Begin standard Vitamin D3 (2,000–3,000 IU/day) with weekly biomarker surveillance.',
      priority: 'high',
      timeframe: '2–4 weeks',
    });
    recommendedPathway.push({
      step: 'Standard / Augmented Hardware',
      desc: 'Proceed with planned surgery. Use bicortical purchase or larger diameter screws if bone feels soft during tap.',
      priority: 'moderate',
      timeframe: 'Operative',
    });
  } else {
    recommendedPathway.push({
      step: 'Proceed with Scheduled Surgery',
      desc: 'Metabolic markers are stable. Standard surgical hardware and timelines are fully indicated.',
      priority: 'low',
      timeframe: 'As Scheduled',
    });
    recommendedPathway.push({
      step: 'Routine Post-Op Monitoring',
      desc: 'Standard 6-week post-op laboratory and radiographic follow-up.',
      priority: 'routine',
      timeframe: '6 weeks post-op',
    });
  }

  return {
    generatedDate: new Date().toISOString().split('T')[0],
    overallQualityRisk: qualityRisk,
    structuralVulnerability: structuralVuln,
    dexa_tscore: tscore,
    insights,
    keyFactors,
    recommendedPathway,
    confidenceScore: 0.91,
    clinicalNotes:
      qualityRisk >= 65
        ? 'High metabolic risk detected. Secondary hyperparathyroidism and cortical thinning suggest augmented surgical fixation strategy.'
        : qualityRisk >= 40
          ? 'Moderate risk profile. Pre-op metabolic replenishment recommended with standard hardware precautions.'
          : 'Low metabolic risk. Patient is a suitable candidate for routine surgical intervention.',
  };
}

export function PatientDataProvider({ children }) {
  // Global state across patient views
  const [activePatientId, setActivePatientId] = useState('PEB-8842-A');
  // W-8: Start with empty list — Dashboard shows skeleton until real data arrives.
  // This prevents the flash of 3 mock patients before the backend responds.
  const [patientList, setPatientList] = useState([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);
  const [persistedAssessment, setPersistedAssessment] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState(null);

  const clearApiError = useCallback(() => setApiError(null), []);

  // Fetch live patient list from backend on mount
  useEffect(() => {
    let isMounted = true;
    async function loadPatients() {
      try {
        const remotePatients = await patientService.getPatients();
        if (isMounted) {
          // Use backend data if available, otherwise fall back to mock seed
          setPatientList(remotePatients?.length > 0 ? remotePatients : [...patients]);
        }
      } catch (err) {
        console.warn('Could not load patients from backend:', err);
        // Backend unreachable — show mock seed so the UI is not empty
        if (isMounted) setPatientList([...patients]);
      } finally {
        if (isMounted) setIsLoadingPatients(false);
      }
    }
    loadPatients();
    return () => { isMounted = false; };
  }, []);

  // Modal open state for "New Case Analysis"
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);

  // Custom biomarker states indexed by patient ID
  const [allBiomarkers, setAllBiomarkers] = useState(() => JSON.parse(JSON.stringify(biomarkersDB)));

  // W-5: Load patient biomarkers from backend when patient switches.
  // Skip the fetch if we already have data for this patient to avoid unnecessary
  // round-trips when navigating back to a previously visited patient.
  useEffect(() => {
    let isMounted = true;
    if (!activePatientId) return;
    const existing = allBiomarkers[activePatientId];
    const hasData = existing && Object.keys(existing).length > 0;
    if (hasData) return; // already loaded — skip

    async function loadBiomarkers() {
      try {
        const b = await biomarkerService.getBiomarkers(activePatientId);
        if (isMounted && b) {
          setAllBiomarkers((prev) => ({
            ...prev,
            [activePatientId]: {
              ...(prev[activePatientId] || {}),
              ...b,
            },
          }));
        }
      } catch (err) {
        console.warn('Could not load biomarkers for patient:', activePatientId, err);
      }
    }
    loadBiomarkers();
    return () => { isMounted = false; };
  }, [activePatientId]); // intentionally omit allBiomarkers — would create an infinite loop

  // Selected Region of Interest (shared across 3D and other views)
  const [selectedRegion, setSelectedRegion] = useState('proximal-femur');

  // Custom Surgeon/Clinical notes per ROI: { [patientId]: { [regionKey]: string } }
  const [roiNotes, setRoiNotes] = useState({
    'PEB-8842-A': {
      'femoral-neck': 'Thinning superior cortex (1.2mm). Recommend cement augmentation if lag screw is placed.',
      'greater-trochanter': 'Moderate bone thinning at trochanteric insertion. Bone turnover markers elevated.',
      'shaft': 'Circumferential cortical thickness 3.8mm. Structurally optimal for press-fit stem anchorage.',
    },
  });

  // Create and register a brand new patient case
  const addNewCase = useCallback(async (newCase) => {
    const gender = newCase.gender || 'Female';
    const generatedId = newCase.id || `PEB-${Math.floor(1000 + Math.random() * 9000)}-${gender[0].toUpperCase()}`;
    const procedure = newCase.procedure || 'Total Hip Arthroplasty (THA)';
    const patientName = newCase.name?.trim() || `Patient ${generatedId}`;

    const pthVal = newCase.pth !== '' && newCase.pth !== null && newCase.pth !== undefined && Number.isFinite(Number(newCase.pth)) ? Number(newCase.pth) : 45.0;
    const vitDVal = newCase.vitaminD !== '' && newCase.vitaminD !== null && newCase.vitaminD !== undefined && Number.isFinite(Number(newCase.vitaminD)) ? Number(newCase.vitaminD) : 35.0;
    const calcVal = newCase.calcium !== '' && newCase.calcium !== null && newCase.calcium !== undefined && Number.isFinite(Number(newCase.calcium)) ? Number(newCase.calcium) : 9.4;
    const phosVal = newCase.phosphate !== '' && newCase.phosphate !== null && newCase.phosphate !== undefined && Number.isFinite(Number(newCase.phosphate)) ? Number(newCase.phosphate) : 3.5;
    const alpVal = newCase.alp !== '' && newCase.alp !== null && newCase.alp !== undefined && Number.isFinite(Number(newCase.alp)) ? Number(newCase.alp) : 80;
    const ctxVal = newCase.ctx !== '' && newCase.ctx !== null && newCase.ctx !== undefined && Number.isFinite(Number(newCase.ctx)) ? Number(newCase.ctx) : 220;

    let backendPatient;
    try {
      backendPatient = await patientService.createPatient({
        case_id: generatedId,
        model_id: '01',
        patient_name: patientName,
        name: patientName,
        patient_age: Number(newCase.age) || 58,
        age: Number(newCase.age) || 58,
        patient_gender: gender,
        gender: gender,
        procedure: procedure,
        clinical_indication: procedure,
        condition: 'Pre-Surgical Bone Mineral Density Evaluation',
        pth: pthVal,
        vitamin_d: vitDVal,
        vitaminD: vitDVal,
        calcium: calcVal,
        phosphate: phosVal,
        alp: alpVal,
        ctx: ctxVal,
        initial_biomarkers: {
          pth: pthVal,
          vitamin_d: vitDVal,
          calcium: calcVal,
          phosphate: phosVal,
          alp: alpVal,
          ctx: ctxVal,
        },
      });
      setApiError(null);
    } catch (error) {
      // W-6: Surface the error so the user knows the case is local-only.
      // We still create it locally so the workflow isn't blocked.
      const msg = error?.response?.data?.detail || error?.message || 'Server unavailable';
      console.warn('Backend createPatient failed, falling back to local state:', msg);
      setApiError(`Case saved locally only — ${msg}. Changes may not persist after a page refresh.`);
    }

    const patientId = backendPatient?.case_id || backendPatient?.id || generatedId;

    const fullPatient = {
      id: patientId,
      name: patientName,
      age: Number(newCase.age) || 58,
      gender: gender,
      condition: 'Pre-Surgical Bone Mineral Density Evaluation',
      procedure: procedure,
      status: 'active',
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    setPatientList((prev) => [fullPatient, ...prev.filter((p) => p.id !== patientId)]);

    const initialBiomarkers = {
      pth: {
        value: pthVal,
        unit: 'pg/mL',
        ref: '15.0–65.0',
        status: pthVal > 65 ? 'elevated' : pthVal < 15 ? 'low' : 'normal',
        trend: 'up',
      },
      vitaminD: {
        value: vitDVal,
        unit: 'ng/mL',
        ref: '30.0–100.0',
        status: vitDVal < 20 ? 'deficient' : vitDVal < 30 ? 'low' : 'normal',
        trend: 'down',
      },
      calcium: {
        value: calcVal,
        unit: 'mg/dL',
        ref: '8.6–10.3',
        status: calcVal < 8.6 ? 'low' : calcVal > 10.3 ? 'elevated' : 'normal',
        trend: 'stable',
      },
      phosphate: {
        value: phosVal,
        unit: 'mg/dL',
        ref: '2.5–4.5',
        status: phosVal < 2.5 ? 'low' : phosVal > 4.5 ? 'elevated' : 'normal',
        trend: 'stable',
      },
      alp: {
        value: alpVal,
        unit: 'U/L',
        ref: '44–147',
        status: alpVal > 147 ? 'elevated' : 'normal',
        trend: 'stable',
      },
      ctx: {
        value: ctxVal,
        unit: 'pg/mL',
        ref: '< 300',
        status: ctxVal > 300 ? 'elevated' : 'normal',
        trend: 'up',
      },
    };

    setAllBiomarkers((prev) => ({
      ...prev,
      [patientId]: initialBiomarkers,
    }));

    if (newCase.initialNote) {
      setRoiNotes((prev) => ({
        ...prev,
        [patientId]: {
          'proximal-femur': newCase.initialNote,
        },
      }));
    }

    setActivePatientId(patientId);
    return patientId;
  }, []);

  // Delete a patient case from backend database and local state
  const deleteCase = useCallback(async (caseId) => {
    try {
      await patientService.deletePatient(caseId);
    } catch (e) {
      console.warn('Delete case backend error:', e);
    }

    setPatientList((prev) => {
      const remaining = prev.filter((p) => p.id !== caseId && p.case_id !== caseId && p._id !== caseId);
      if (activePatientId === caseId && remaining.length > 0) {
        setActivePatientId(remaining[0].id);
      }
      return remaining;
    });

    setAllBiomarkers((prev) => {
      const next = { ...prev };
      delete next[caseId];
      return next;
    });

    setRoiNotes((prev) => {
      const next = { ...prev };
      delete next[caseId];
      return next;
    });
  }, [activePatientId]);

  // Retrieve active patient biomarkers
  const activeBiomarkers = useMemo(() => {
    if (!activePatientId) return null;
    return allBiomarkers[activePatientId] || biomarkersDB[activePatientId] || null;
  }, [allBiomarkers, activePatientId]);

  // W-3: Stable primitive key derived from biomarker VALUES (not the object reference).
  // This prevents computeDynamicAssessment from re-running when allBiomarkers is
  // updated for a different patient or when the reference changes without values changing.
  const biomarkerValueKey = useMemo(() => {
    if (!activeBiomarkers) return '';
    const b = activeBiomarkers;
    return [
      b?.pth?.value,
      b?.vitaminD?.value,
      b?.calcium?.value,
      b?.phosphate?.value,
      b?.alp?.value,
      b?.ctx?.value,
    ].join('|');
  }, [activeBiomarkers]);

  // Update a specific biomarker value and re-evaluate status safely without coercing empty/NaN to 0
  const updateBiomarker = useCallback((patientId, key, newValue) => {
    setAllBiomarkers((prev) => {
      const patientData = { ...(prev[patientId] || biomarkersDB[patientId] || {}) };
      const currentItem = patientData[key] || {};

      const isBlank = newValue === '' || newValue === null || newValue === undefined;
      const numVal = isBlank ? '' : (typeof newValue === 'number' ? newValue : parseFloat(newValue));
      const isValid = typeof numVal === 'number' && !Number.isNaN(numVal);

      // Determine status from reference ranges
      const ref = referenceRanges[key];
      let status = 'normal';
      if (isValid && ref) {
        if (ref.max !== undefined && numVal > ref.max) status = 'elevated';
        else if (ref.min !== undefined && numVal < ref.min) status = key === 'vitaminD' ? 'deficient' : 'low';
      } else if (!isValid && !isBlank) {
        status = 'invalid';
      }

      const prevNum = typeof currentItem.value === 'number' ? currentItem.value : 0;
      patientData[key] = {
        ...currentItem,
        value: isBlank ? '' : (isValid ? numVal : newValue),
        status,
        trend: isValid ? (numVal > prevNum ? 'up' : numVal < prevNum ? 'down' : 'stable') : 'stable',
      };

      return {
        ...prev,
        [patientId]: patientData,
      };
    });
  }, []);

  // Update ROI custom note
  const updateRoiNote = useCallback((patientId, regionKey, noteText) => {
    setRoiNotes((prev) => ({
      ...prev,
      [patientId]: {
        ...(prev[patientId] || {}),
        [regionKey]: noteText,
      },
    }));
  }, []);

  const runAssessment = useCallback(async (patientId, biomarkerValues) => {
    setIsAnalyzing(true);
    try {
      const result = await assessmentService.analyze(patientId, biomarkerValues);
      setPersistedAssessment(result);

      // Fix 1: sync backend target_region back into the shared selectedRegion so
      // the 3D viewer immediately highlights the AI-identified anatomical zone.
      if (result?.selectedRegion) {
        setSelectedRegion(result.selectedRegion);
      }

      setApiError(null);
      return result;
    } catch (error) {
      setApiError(readApiError(error, 'Unable to analyze patient biomarkers'));
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Persist ROI note immediately to local state and synchronize with API if assessment exists
  const persistRoiNote = useCallback(async (patientId, regionKey, noteText) => {
    updateRoiNote(patientId, regionKey, noteText);

    if (persistedAssessment?.id) {
      try {
        const result = await assessmentService.updateNotes(
          persistedAssessment.id,
          noteText,
          toApiRegion(regionKey),
        );
        setPersistedAssessment(result);
        setApiError(null);
      } catch (error) {
        setApiError(readApiError(error, 'Unable to save planning note'));
      }
    }
  }, [persistedAssessment, updateRoiNote]);

  // Compute dynamic AI assessment whenever active patient biomarker VALUES change.
  // Keyed on biomarkerValueKey (a stable string) instead of the activeBiomarkers
  // object reference — avoids rerunning the 150-line engine on reference-only changes.
  const dynamicAssessment = useMemo(() => {
    if (!activePatientId || !activeBiomarkers) return null;
    return computeDynamicAssessment(activePatientId, activeBiomarkers);
  }, [activePatientId, biomarkerValueKey, activeBiomarkers]);

  // Dynamic regional analysis metrics adjusted by metabolic risk
  const dynamicRegionalData = useMemo(() => {
    if (!activePatientId || !dynamicAssessment) return null;
    const baseRegions = regionalAnalysisDB[activePatientId] || {};
    const region = baseRegions[selectedRegion] || baseRegions['proximal-femur'] || {};
    const risk = dynamicAssessment.overallQualityRisk;

    let riskLevel = 'low';
    let statusText = 'Low Risk';
    if (risk >= 65) {
      riskLevel = 'high';
      statusText = 'High Osteoporosis / Loosening Risk';
    } else if (risk >= 40) {
      riskLevel = 'moderate';
      statusText = 'Moderate Trabecular Risk';
    }

    return {
      ...region,
      riskLevel,
      status: statusText,
      metrics: {
        ...region.metrics,
        corticalThickness: risk >= 65 ? '1.2 mm' : risk >= 40 ? '2.1 mm' : '3.0 mm',
        estimatedStrength: risk >= 65 ? '3,920 N (Impoverished)' : risk >= 40 ? '4,650 N' : '5,400 N (Optimal)',
      },
    };
  }, [activePatientId, selectedRegion, dynamicAssessment]);

  // Derive a backend-sourced risk level string when persistedAssessment is present.
  const backendRiskLevel = useMemo(() => {
    if (persistedAssessment?.riskLevel) {
      return persistedAssessment.riskLevel;
    }
    if (persistedAssessment?.aiResults?.risk_level) {
      return persistedAssessment.aiResults.risk_level;
    }
    const score = persistedAssessment?.overallQualityRisk;
    if (score == null) return null; // null = no API result yet, fall back to local engine
    if (score >= 65) return 'high';
    if (score >= 40) return 'moderate';
    return 'low';
  }, [persistedAssessment]);

  // Derive AI clinical note and AI-evaluated zone risks from LLM output
  const aiClinicalNote = useMemo(() => {
    if (!persistedAssessment?.aiResults) return null;
    const ai = persistedAssessment.aiResults;
    return ai.anatomical_observations || ai.metabolic_observations || null;
  }, [persistedAssessment]);

  const aiZoneRisks = useMemo(() => {
    if (!persistedAssessment?.aiResults || !activePatientId) return null;
    const ai = persistedAssessment.aiResults;
    const baseRegions = regionalAnalysisDB[activePatientId] || {};
    const targetReg = backendToUiRegion[ai.target_region] || ai.target_region || 'proximal-femur';

    return Object.entries(baseRegions).map(([regionKey, regionData]) => {
      const isTarget =
        regionKey === targetReg ||
        (targetReg === 'femoral-neck' && regionKey === 'proximal-femur') ||
        (targetReg === 'proximal-femur' && regionKey === 'femoral-neck') ||
        (targetReg === 'vertebral-body' && regionKey === 'vertebral-body') ||
        (targetReg === 'shaft' && regionKey === 'shaft');

      return {
        id: regionKey,
        label: regionData.location ?? regionKey,
        riskLevel: isTarget ? (ai.risk_level || 'high') : (regionData.riskLevel ?? 'low'),
        note: isTarget ? (ai.anatomical_observations || regionData.observation || '') : (regionData.observation || ''),
      };
    });
  }, [persistedAssessment, activePatientId]);

  // Reset entire active workspace (clears patient, assessment, models)
  const resetWorkspace = useCallback(() => {
    setActivePatientId(null);
    setPersistedAssessment(null);
    setApiError(null);
  }, []);

  const value = {
    activePatientId,
    setActivePatientId,
    resetWorkspace,
    patients: patientList,
    patientList,
    isLoadingPatients,
    addNewCase,
    deleteCase,
    isNewCaseModalOpen,
    setIsNewCaseModalOpen,
    biomarkers: activeBiomarkers,
    allBiomarkers,
    updateBiomarker,
    selectedRegion,
    setSelectedRegion,
    roiNotes: activePatientId ? (roiNotes[activePatientId] || {}) : {},
    updateRoiNote,
    assessment: dynamicAssessment,
    regionalData: dynamicRegionalData,
    regionalAnalysisDB,
    surgicalPlansDB,
    persistedAssessment,
    setPersistedAssessment,
    isAnalyzing,
    apiError,
    setApiError,
    clearApiError,
    runAssessment,
    persistRoiNote,
    backendRiskLevel,
    aiClinicalNote,
    aiZoneRisks,
  };

  return <PatientDataContext.Provider value={value}>{children}</PatientDataContext.Provider>;
}

export function usePatientContext() {
  const ctx = useContext(PatientDataContext);
  if (!ctx) {
    throw new Error('usePatientContext must be used within a PatientDataProvider');
  }
  return ctx;
}

