import { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  patients,
  biomarkersDB,
  assessmentsDB,
  regionalAnalysisDB,
  surgicalPlansDB,
  referenceRanges,
} from '../data/mockData';

const PatientDataContext = createContext(null);

// ─────────────────────────────────────────────────────────────
// Dynamic Rule-Based AI Engine
// Computes clinical risk, insights, and pathways from biomarkers
// ─────────────────────────────────────────────────────────────
export function computeDynamicAssessment(patientId, biomarkers) {
  const pth = biomarkers?.pth?.value ?? 65;
  const vitD = biomarkers?.vitaminD?.value ?? 30;
  const calcium = biomarkers?.calcium?.value ?? 9.0;
  const phosphate = biomarkers?.phosphate?.value ?? 3.5;
  const alp = biomarkers?.alp?.value ?? 80;
  const ctx = biomarkers?.ctx?.value ?? 300;

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
      label: 'Serum Calcium',
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

  // Custom biomarker states indexed by patient ID
  const [allBiomarkers, setAllBiomarkers] = useState(() => JSON.parse(JSON.stringify(biomarkersDB)));

  // Selected Region of Interest (shared across 3D and other views)
  const [selectedRegion, setSelectedRegion] = useState('proximal-femur');

  // Custom Surgeon/Clinical notes per ROI: { [patientId]: { [regionKey]: string } }
  const [roiNotes, setRoiNotes] = useState({
    'PEB-8842-A': {
      'proximal-femur': 'Thinning superior cortex (1.2mm). Recommend cement augmentation if lag screw is placed.',
      'vertebral-body': 'L4-L5 anterior endplate intact. Standard PEEK cage sizing indicated.',
      'acetabulum': 'Adequate bone stock for cup seating. No structural augmentation needed.',
    },
  });

  // Retrieve active patient biomarkers
  const activeBiomarkers = useMemo(() => {
    return allBiomarkers[activePatientId] || biomarkersDB[activePatientId] || biomarkersDB['PEB-8842-A'];
  }, [allBiomarkers, activePatientId]);

  // Update a specific biomarker value and re-evaluate status
  const updateBiomarker = useCallback((patientId, key, newValue) => {
    setAllBiomarkers((prev) => {
      const patientData = { ...(prev[patientId] || biomarkersDB[patientId] || {}) };
      const currentItem = patientData[key] || {};
      const numVal = parseFloat(newValue) || 0;

      // Determine status from reference ranges
      const ref = referenceRanges[key];
      let status = 'normal';
      if (ref) {
        if (ref.max !== undefined && numVal > ref.max) status = 'elevated';
        else if (ref.min !== undefined && numVal < ref.min) status = key === 'vitaminD' ? 'deficient' : 'low';
      }

      patientData[key] = {
        ...currentItem,
        value: numVal,
        status,
        trend: numVal > (currentItem.value || 0) ? 'up' : 'down',
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

  // Compute dynamic AI assessment whenever active patient biomarkers change
  const dynamicAssessment = useMemo(() => {
    return computeDynamicAssessment(activePatientId, activeBiomarkers);
  }, [activePatientId, activeBiomarkers]);

  // Dynamic regional analysis metrics adjusted by metabolic risk
  const dynamicRegionalData = useMemo(() => {
    const baseRegions = regionalAnalysisDB[activePatientId] || regionalAnalysisDB['PEB-8842-A'] || {};
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

  const value = {
    activePatientId,
    setActivePatientId,
    patients,
    biomarkers: activeBiomarkers,
    allBiomarkers,
    updateBiomarker,
    selectedRegion,
    setSelectedRegion,
    roiNotes: roiNotes[activePatientId] || {},
    updateRoiNote,
    assessment: dynamicAssessment,
    regionalData: dynamicRegionalData,
    regionalAnalysisDB,
    surgicalPlansDB,
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
