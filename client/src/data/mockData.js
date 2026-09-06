// Mock Data Service for EndoBone AI
// Provides realistic patient data for testing and demonstration

export const referenceRanges = {
  pth: { min: 15, max: 65, unit: 'pg/mL' },
  vitaminD: { min: 30, max: 100, unit: 'ng/mL' },
  calcium: { min: 8.6, max: 10.3, unit: 'mg/dL' },
  phosphate: { min: 2.5, max: 4.5, unit: 'mg/dL' },
  alp: { min: 44, max: 147, unit: 'U/L' },
  tsh: { min: 0.4, max: 4.0, unit: 'mIU/L' },
  free_t4: { min: 0.8, max: 1.8, unit: 'ng/dL' },
  ctx: { max: 300, unit: 'pg/mL' },
  p1np: { min: 15, max: 80, unit: 'mcg/L' }
};

export const patients = [
  {
    id: 'PEB-8842-A',
    name: 'Patient A',
    age: 68,
    gender: 'Female',
    mrn: 'MRN-892834',
    procedure: 'L4-L5 Discectomy & Fusion',
    model_id: 'spine',
    scheduledDate: '2024-10-24',
    referralDate: '2024-08-10',
    clinician: 'Dr. James Morrison, MD',
    status: 'active',
    riskLevel: 'high'
  },
  {
    id: 'PEB-8841-B',
    name: 'Patient B',
    age: 72,
    gender: 'Male',
    mrn: 'MRN-892835',
    procedure: 'Proximal Femur ORIF',
    model_id: '02',
    scheduledDate: '2024-09-15',
    referralDate: '2024-08-01',
    clinician: 'Dr. Sarah Chen, MD',
    status: 'pending-review',
    riskLevel: 'moderate'
  },
  {
    id: 'PEB-8840-C',
    name: 'Patient C',
    age: 65,
    gender: 'Female',
    mrn: 'MRN-892836',
    procedure: 'Vertebroplasty L3',
    model_id: 'spine',
    scheduledDate: '2024-11-01',
    referralDate: '2024-07-25',
    clinician: 'Dr. Michael Zhang, MD',
    status: 'completed',
    riskLevel: 'low'
  },
  {
    id: 'PEB-8839-D',
    name: 'Patient D',
    age: 75,
    gender: 'Male',
    mrn: 'MRN-892837',
    procedure: 'T12-L1 Fusion',
    model_id: 'spine',
    scheduledDate: '2024-10-10',
    referralDate: '2024-08-05',
    clinician: 'Dr. Patricia Kumar, MD',
    status: 'active',
    riskLevel: 'moderate'
  }
];

export const biomarkersDB = {
  'PEB-8842-A': {
    date: '2024-08-14',
    pth: { value: '', unit: 'pg/mL', ref: '15.0-65.0', status: 'normal', trend: 'stable' },
    vitaminD: { value: '', unit: 'ng/mL', ref: '30.0-100.0', status: 'normal', trend: 'stable' },
    calcium: { value: '', unit: 'mg/dL', ref: '8.6-10.3', status: 'normal', trend: 'stable' },
    phosphate: { value: '', unit: 'mg/dL', ref: '2.5-4.5', status: 'normal', trend: 'stable' },
    alp: { value: '', unit: 'U/L', ref: '44-147', status: 'normal', trend: 'stable' },
    tsh: { value: '', unit: 'mIU/L', ref: '0.4-4.0', status: 'normal', trend: 'stable' },
    free_t4: { value: '', unit: 'ng/dL', ref: '0.8-1.8', status: 'normal', trend: 'stable' },
    ctx: { value: '', unit: 'pg/mL', ref: '< 300', status: 'normal', trend: 'stable' },
    p1np: { value: '', unit: 'mcg/L', ref: '15-80', status: 'normal', trend: 'stable' },
    magnesium: { value: '', unit: 'mg/dL', ref: '1.8-2.2', status: 'normal', trend: 'stable' }
  },
  'PEB-8841-B': {
    date: '2024-08-12',
    pth: { value: 72.5, unit: 'pg/mL', ref: '15.0-65.0', status: 'elevated', trend: 'up' },
    vitaminD: { value: 22.3, unit: 'ng/mL', ref: '30.0-100.0', status: 'deficient', trend: 'down' },
    calcium: { value: 9.1, unit: 'mg/dL', ref: '8.6-10.3', status: 'normal', trend: 'stable' },
    phosphate: { value: 3.4, unit: 'mg/dL', ref: '2.5-4.5', status: 'normal', trend: 'stable' },
    alp: { value: 92, unit: 'U/L', ref: '44-147', status: 'normal', trend: 'stable' },
    tsh: { value: 2.1, unit: 'mIU/L', ref: '0.4-4.0', status: 'normal', trend: 'stable' },
    free_t4: { value: 1.3, unit: 'ng/dL', ref: '0.8-1.8', status: 'normal', trend: 'stable' },
    ctx: { value: 420, unit: 'pg/mL', ref: '< 300', status: 'elevated', trend: 'up' },
    p1np: { value: 58, unit: 'mcg/L', ref: '15-80', status: 'normal', trend: 'stable' },
    magnesium: { value: 2.0, unit: 'mg/dL', ref: '1.8-2.2', status: 'normal', trend: 'stable' }
  },
  'PEB-8840-C': {
    date: '2024-08-08',
    pth: { value: 48.2, unit: 'pg/mL', ref: '15.0-65.0', status: 'normal', trend: 'stable' },
    vitaminD: { value: 42.1, unit: 'ng/mL', ref: '30.0-100.0', status: 'normal', trend: 'up' },
    calcium: { value: 9.4, unit: 'mg/dL', ref: '8.6-10.3', status: 'normal', trend: 'stable' },
    phosphate: { value: 3.3, unit: 'mg/dL', ref: '2.5-4.5', status: 'normal', trend: 'stable' },
    alp: { value: 78, unit: 'U/L', ref: '44-147', status: 'normal', trend: 'stable' },
    tsh: { value: 1.5, unit: 'mIU/L', ref: '0.4-4.0', status: 'normal', trend: 'stable' },
    free_t4: { value: 1.2, unit: 'ng/dL', ref: '0.8-1.8', status: 'normal', trend: 'stable' },
    ctx: { value: 250, unit: 'pg/mL', ref: '< 300', status: 'normal', trend: 'stable' },
    p1np: { value: 45, unit: 'mcg/L', ref: '15-80', status: 'normal', trend: 'stable' },
    magnesium: { value: 2.1, unit: 'mg/dL', ref: '1.8-2.2', status: 'normal', trend: 'stable' }
  }
};

export const assessmentsDB = {
  'PEB-8842-A': {
    generatedDate: '2024-08-14',
    overallQualityRisk: 75,
    structuralVulnerability: 30,
    dexa_tscore: -2.8,
    insights: [
      {
        type: 'metabolic',
        severity: 'high',
        text: 'Elevated PTH (85 pg/mL) alongside low serum calcium (8.2 mg/dL) indicates secondary hyperparathyroidism. Hypocalcemia is driving compensatory parathyroid hormone elevation and increased bone resorption.'
      },
      {
        type: 'structural',
        severity: 'high',
        text: 'Localized cortical thinning detected on the superior aspect of the femoral neck. High risk of micro-fracture under lateral load. Trabecular bone loss is moderate but accelerating due to elevated bone turnover.'
      },
      {
        type: 'endocrine',
        severity: 'moderate',
        text: 'Vitamin D deficiency (18.5 ng/mL) is significantly below therapeutic threshold. This is driving secondary hyperparathyroidism and reducing intestinal calcium absorption.'
      }
    ],
    keyFactors: [
      { label: 'PTH', value: 85.2, unit: 'pg/mL', impact: 'Elevated bone resorption rate', direction: 'up' },
      { label: 'Calcium', value: 8.2, unit: 'mg/dL', impact: 'Hypocalcemia driving secondary hyperparathyroidism', direction: 'down' },
      { label: 'Vitamin D', value: 18.5, unit: 'ng/mL', impact: 'Deficiency reducing calcium absorption', direction: 'down' },
      { label: 'CTX', value: 450, unit: 'pg/mL', impact: 'Elevated bone turnover marker', direction: 'up' }
    ],
    recommendedPathway: [
      {
        step: 'Immediate Stabilization',
        desc: 'Initiate calcium (1200 mg/day) and Vitamin D supplementation (4000 IU/day) protocol to normalize serum levels within 4-6 weeks.',
        priority: 'critical',
        timeframe: '1 week'
      },
      {
        step: 'Further Diagnostics',
        desc: 'Schedule high-resolution peripheral quantitative computed tomography (HR-pQCT) to verify cortical porosity and assess trabecular microarchitecture in detail.',
        priority: 'high',
        timeframe: '2-3 weeks'
      },
      {
        step: 'Surgical Deferment',
        desc: 'Consider delaying implant procedure by 6-8 weeks until metabolic markers stabilize within normal ranges and Vitamin D reaches therapeutic level (>30 ng/mL).',
        priority: 'high',
        timeframe: '6-8 weeks'
      }
    ],
    confidenceScore: 0.87,
    clinicalNotes: 'Secondary hyperparathyroidism with concurrent hypocalcemia and vitamin D deficiency creates high-risk scenario for surgical complications. Recommend metabolic stabilization before proceeding with planned fusion.'
  },
  'PEB-8841-B': {
    generatedDate: '2024-08-12',
    overallQualityRisk: 62,
    structuralVulnerability: 45,
    dexa_tscore: -2.3,
    insights: [
      {
        type: 'metabolic',
        severity: 'moderate',
        text: 'Elevated PTH (72.5 pg/mL) with borderline normal calcium suggests early-stage secondary hyperparathyroidism. Vitamin D deficiency is a contributing factor.'
      },
      {
        type: 'structural',
        severity: 'moderate',
        text: 'Moderate trabecular bone loss with preserved cortical thickness. Risk of stress fracture under high-load conditions.'
      }
    ],
    keyFactors: [
      { label: 'PTH', value: 72.5, unit: 'pg/mL', impact: 'Moderately elevated bone resorption', direction: 'up' },
      { label: 'Vitamin D', value: 22.3, unit: 'ng/mL', impact: 'Deficiency contributing to hyperparathyroidism', direction: 'down' }
    ],
    recommendedPathway: [
      {
        step: 'Vitamin D Supplementation',
        desc: 'Begin high-dose vitamin D3 (5000 IU daily) with monthly monitoring until levels reach >30 ng/mL.',
        priority: 'high',
        timeframe: '8-12 weeks'
      },
      {
        step: 'Metabolic Monitoring',
        desc: 'Repeat biomarker panel in 6 weeks to assess response to supplementation and PTH normalization.',
        priority: 'high',
        timeframe: '6 weeks'
      },
      {
        step: 'Proceed with Caution',
        desc: 'Surgery can proceed with augmented hardware strategy pending metabolic improvement confirmation.',
        priority: 'moderate',
        timeframe: 'Upon biomarker confirmation'
      }
    ],
    confidenceScore: 0.79,
    clinicalNotes: 'Less severe metabolic derangement compared to Patient A. Vitamin D supplementation with monitoring should improve outcomes substantially.'
  },
  'PEB-8840-C': {
    generatedDate: '2024-08-08',
    overallQualityRisk: 38,
    structuralVulnerability: 18,
    dexa_tscore: -1.6,
    insights: [
      {
        type: 'metabolic',
        severity: 'low',
        text: 'Metabolic parameters are well-controlled. PTH and vitamin D are within normal ranges, indicating good baseline bone metabolism.'
      },
      {
        type: 'structural',
        severity: 'low',
        text: 'Cortical and trabecular bone density are preserved. Low risk profile for surgical complications.'
      }
    ],
    keyFactors: [
      { label: 'Vitamin D', value: 42.1, unit: 'ng/mL', impact: 'Optimal level for bone health', direction: 'stable' },
      { label: 'PTH', value: 48.2, unit: 'pg/mL', impact: 'Normal, well-controlled', direction: 'stable' }
    ],
    recommendedPathway: [
      {
        step: 'Continue Current Management',
        desc: 'Maintain current vitamin D and calcium intake. No immediate interventions needed.',
        priority: 'low',
        timeframe: 'Ongoing'
      },
      {
        step: 'Proceed with Surgery',
        desc: 'Patient is an excellent candidate for planned procedure. Standard hardware approach is appropriate.',
        priority: 'low',
        timeframe: 'As scheduled'
      },
      {
        step: 'Post-Operative Monitoring',
        desc: 'Standard post-operative biomarker checks at 6 weeks and 3 months to ensure continued metabolic stability.',
        priority: 'routine',
        timeframe: '6-12 weeks post-op'
      }
    ],
    confidenceScore: 0.92,
    clinicalNotes: 'Excellent metabolic and structural profile. Low surgical risk. Recommend proceeding as planned.'
  }
};

export const regionalAnalysisDB = {
  'PEB-8842-A': {
    'proximal-femur': {
      location: 'Proximal Femur',
      anatomy: 'Femoral neck and intertrochanteric region',
      observation: 'Localized cortical thinning detected on the superior aspect of the femoral neck (cortical thickness 1.2 mm vs normal 3.0 mm). High risk of micro-fracture under lateral load. Trabecular bone loss is evident with qualitative assessment showing irregular spacing.',
      metrics: {
        trabecularVBMD: '112.4 mg/cm³',
        corticalVBMD: '845.1 mg/cm³',
        estimatedStrength: '4,210 N',
        corticalThickness: '1.2 mm',
        trabecularPattern: 'Irregular'
      },
      status: 'Osteoporosis Risk',
      riskLevel: 'high',
      recommendation: 'Consider augmented fixation strategy. Augmented screws recommended.',
      historyMRI: 'MRI from 6 months ago showed cortical thickness of 1.8 mm - progressive thinning noted.',
      comparisonToPrevious: '33% cortical thickness loss in 6 months'
    },
    'greater-trochanter': {
      location: 'Greater Trochanter',
      anatomy: 'Abductor tendon insertion site on proximal femur',
      observation: 'Moderate cortical thinning at the trochanteric crest with elevated local bone turnover markers. Preserved biomechanical anchor strength.',
      metrics: {
        trabecularVBMD: '198.6 mg/cm³',
        corticalVBMD: '812.4 mg/cm³',
        estimatedStrength: '3,840 N',
        corticalThickness: '2.1 mm',
        trabecularPattern: 'Mildly rarefied'
      },
      status: 'Moderate Risk',
      riskLevel: 'moderate',
      recommendation: 'Careful soft-tissue handling during abductor release and trochanteric reattachment.',
      historyMRI: 'Previous imaging showed stable trochanteric cortical profile.',
      comparisonToPrevious: 'Stable trabecular architecture'
    },
    'acetabulum': {
      location: 'Acetabulum',
      anatomy: 'Hip socket for potential hip arthroplasty considerations',
      observation: 'Structural integrity maintained. Cortical shell thickness adequate. No acetabular dysplasia noted.',
      metrics: {
        corticalVBMD: '890.2 mg/cm³',
        estimatedStrength: '5,120 N',
        shellThickness: '2.8 mm'
      },
      status: 'Low Risk',
      riskLevel: 'low',
      recommendation: 'No additional interventions for acetabular region.',
      historyMRI: 'Stable compared to 12 months ago.',
      comparisonToPrevious: 'Minimal change'
    }
  },
  'PEB-8841-B': {
    'proximal-femur': {
      location: 'Proximal Femur',
      anatomy: 'Femoral neck and intertrochanteric region',
      observation: 'Moderate trabecular bone loss visible. Cortical thickness is preserved at 2.2 mm. Pattern suggests accelerated bone turnover but not yet critical.',
      metrics: {
        trabecularVBMD: '125.8 mg/cm³',
        corticalVBMD: '865.3 mg/cm³',
        estimatedStrength: '4,580 N',
        corticalThickness: '2.2 mm',
        trabecularPattern: 'Regular'
      },
      status: 'Moderate Risk',
      riskLevel: 'moderate',
      recommendation: 'Standard hardware with consideration for augmentation if stress testing indicates need.',
      historyMRI: 'Previous study 8 months ago showed better preservation.',
      comparisonToPrevious: 'Progressive 12% vBMD loss over 8 months'
    }
  }
};

export const surgicalPlansDB = {
  'PEB-8842-A': {
    patientId: 'PEB-8842-A',
    procedureDate: '2024-10-24',
    procedure: 'L4-L5 Discectomy & Fusion',
    surgicalSite: 'L4-L5 Lumbar',
    surgeon: 'Dr. James Morrison, MD',
    hardware: {
      pedicleScrewsAugmented: true,
      pedicleScrewsStandard: false,
      titaniumRods: true,
      interbodySpacers: true,
      cageType: 'PEEK intervertebral cage',
      augmentationType: 'Calcium phosphate cement'
    },
    riskFactors: {
      hardwareLooseningRisk: { level: 'HIGH', percentage: 82, recommendation: 'Use augmented screws with calcium phosphate' },
      boneDensityIntegration: { level: 'MODERATE', percentage: 55, recommendation: 'Extended time to fusion expected (4-6 months)' },
      corticalThinning: { level: 'HIGH', percentage: 88, recommendation: 'Monitor closely for osteointegration' },
      metabolicControl: { level: 'POOR', percentage: 75, recommendation: 'Defer surgery until metabolic parameters normalized' }
    },
    estimatedFusionTime: '16-20 weeks',
    postOpProtocol: 'Non-weightbearing for 8 weeks, then graduated loading protocol over 12 weeks',
    followUpSchedule: [
      { timepoint: '2 weeks', assessment: 'Clinical evaluation, pain/mobility' },
      { timepoint: '6 weeks', assessment: 'Biomarker panel, imaging' },
      { timepoint: '12 weeks', assessment: 'Clinical exam, pain scores' },
      { timepoint: '24 weeks', assessment: 'Fusion assessment, imaging' }
    ],
    clinicalNotes: 'High risk case requiring surgeon experience with metabolic bone disease. Recommend augmented fixation strategy and preoperative metabolic optimization.'
  },
  'PEB-8841-B': {
    patientId: 'PEB-8841-B',
    procedureDate: '2024-09-15',
    procedure: 'Proximal Femur ORIF',
    surgicalSite: 'Proximal Femur - Intertrochanteric',
    surgeon: 'Dr. Sarah Chen, MD',
    hardware: {
      intramedullaryNail: true,
      lagScrews: 2,
      derotationScrew: true,
      augmentation: 'Calcium phosphate cement'
    },
    riskFactors: {
      hardwareLooseningRisk: { level: 'MODERATE', percentage: 65, recommendation: 'Consider augmented lag screws' },
      boneDensityIntegration: { level: 'MODERATE', percentage: 62, recommendation: 'Standard fusion timeline expected' },
      corticalThinning: { level: 'MODERATE', percentage: 45, recommendation: 'Monitor but acceptable risk' }
    },
    estimatedHealing: '12-16 weeks',
    postOpProtocol: 'Immediate ROM exercises, partial weight-bearing at 6 weeks, full weight-bearing at 12 weeks',
    followUpSchedule: [
      { timepoint: '6 weeks', assessment: 'Clinical exam, biomarkers' },
      { timepoint: '12 weeks', assessment: 'Weight-bearing tolerance, imaging' },
      { timepoint: '24 weeks', assessment: 'Return to function assessment' }
    ],
    clinicalNotes: 'Moderate risk. Metabolic optimization recommended before surgery. Good candidate for augmented fixation strategy.'
  },
  'PEB-8840-C': {
    patientId: 'PEB-8840-C',
    procedureDate: '2024-11-01',
    procedure: 'Vertebroplasty L3',
    surgicalSite: 'L3 Vertebral Body',
    surgeon: 'Dr. Michael Zhang, MD',
    hardware: {
      cementType: 'PMMA bone cement',
      volumePerVertebra: '3-4 mL',
      additionalStabilization: 'None'
    },
    riskFactors: {
      hardwareLooseningRisk: { level: 'LOW', percentage: 15, recommendation: 'Standard technique appropriate' },
      boneDensityIntegration: { level: 'GOOD', percentage: 78, recommendation: 'Excellent cement integration expected' },
      corticalThinning: { level: 'LOW', percentage: 10, recommendation: 'No augmentation needed' }
    },
    estimatedProcedureTime: '30-45 minutes',
    postOpProtocol: 'Immediate protected weight-bearing, graduated activity as tolerated',
    followUpSchedule: [
      { timepoint: '2 weeks', assessment: 'Pain/functional improvement' },
      { timepoint: '6 weeks', assessment: 'Imaging confirmation of cement placement' }
    ],
    clinicalNotes: 'Excellent surgical candidate. Low metabolic risk. Straightforward procedure expected with good outcomes.'
  }
};

export const trendingData = {
  'PEB-8842-A': {
    lastSixMonths: [
      { date: '2024-02-14', pth: 68.5, vitaminD: 24.2, calcium: 8.8, ctx: 380 },
      { date: '2024-03-14', pth: 72.1, vitaminD: 21.8, calcium: 8.6, ctx: 395 },
      { date: '2024-04-14', pth: 76.3, vitaminD: 19.5, calcium: 8.4, ctx: 410 },
      { date: '2024-05-14', pth: 80.1, vitaminD: 19.2, calcium: 8.3, ctx: 425 },
      { date: '2024-06-14', pth: 82.8, vitaminD: 18.8, calcium: 8.2, ctx: 440 },
      { date: '2024-08-14', pth: 85.2, vitaminD: 18.5, calcium: 8.2, ctx: 450 }
    ],
    trend: 'Declining vitamin D and calcium with rising PTH and bone turnover markers'
  }
};

// Helper function to get biomarkers by patient ID
export const getBiomarkersByPatientId = (patientId) => {
  return biomarkersDB[patientId] || null;
};

// Helper function to get assessment by patient ID
export const getAssessmentByPatientId = (patientId) => {
  return assessmentsDB[patientId] || null;
};

// Helper function to get regional analysis
export const getRegionalAnalysis = (patientId, region) => {
  return regionalAnalysisDB[patientId]?.[region] || null;
};

// Helper function to get surgical plan
export const getSurgicalPlan = (patientId) => {
  return surgicalPlansDB[patientId] || null;
};

// Helper function to get trending data
export const getTrendingData = (patientId) => {
  return trendingData[patientId] || null;
};

// Get all patients
export const getAllPatients = () => {
  return patients;
};

// Get patient by ID
export const getPatientById = (patientId) => {
  return patients.find(p => p.id === patientId) || null;
};

// Get reference range for biomarker
export const getReferenceRange = (biomarkerKey) => {
  return referenceRanges[biomarkerKey] || null;
};

// Helper to determine status based on value and reference range
export const getBiomarkerStatus = (value, biomarkerKey) => {
  const range = referenceRanges[biomarkerKey];
  if (!range) return 'unknown';

  if (biomarkerKey === 'ctx') {
    return value > range.max ? 'elevated' : 'normal';
  }

  if (value < range.min) return 'low';
  if (value > range.max) return 'elevated';
  return 'normal';
};
