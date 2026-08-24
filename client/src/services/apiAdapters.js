export const backendToUiRegion = {
  femoral_neck: 'femoral-neck',
  greater_trochanter: 'greater-trochanter',
  shaft: 'shaft',
  none: '',
};

const uiToBackendRegion = {
  'femoral-neck': 'femoral_neck',
  'greater-trochanter': 'greater_trochanter',
  shaft: 'shaft',
  'proximal-femur': 'femoral_neck',
};

export function toApiRegion(region) {
  return uiToBackendRegion[region] || region || 'none';
}

export function toUiPatient(patient) {
  if (!patient) return null;
  return {
    ...patient,
    id: patient.case_id || patient._id || patient.id,
    name: patient.patient_name || patient.name || 'Anonymous Patient',
    age: patient.patient_age ?? patient.age ?? 65,
    gender: patient.patient_gender || patient.gender || 'Female',
    mrn: patient.mrn || patient.case_id || patient._id || patient.id,
    procedure: patient.procedure || patient.clinical_indication || 'Pre-surgical bone planning',
    condition: patient.condition || patient.clinical_indication || 'Pre-Surgical Bone Mineral Density Evaluation',
    status: patient.status || 'active',
  };
}

export function toUiAssessment(assessment) {
  if (!assessment) return null;
  const aiResults = assessment.ai_results || assessment.aiResults || null;
  const rawRiskScore = assessment.overallQualityRisk ?? assessment.overall_quality_risk ?? assessment.riskScore;
  const numericRiskScore = rawRiskScore === null || rawRiskScore === undefined || rawRiskScore === ''
    ? undefined
    : Number(rawRiskScore);

  const riskLevel = aiResults?.risk_level || assessment.riskLevel || 'moderate';
  // Map categorical AI risk level to representative 0-100 composite score if not explicitly set
  const derivedNumericRisk = Number.isFinite(numericRiskScore)
    ? numericRiskScore
    : riskLevel === 'high'
    ? 82
    : riskLevel === 'moderate'
    ? 52
    : 24;

  // Normalise contributing_factors — backend sends [{ factor, explanation }]
  const rawFactors = aiResults?.contributing_factors ?? assessment.contributing_factors ?? null;
  const contributingFactors = Array.isArray(rawFactors) ? rawFactors : null;

  return {
    ...assessment,
    id: assessment._id || assessment.id,
    aiResults: aiResults ? { ...aiResults, contributing_factors: contributingFactors } : null,
    riskLevel,
    overallQualityRisk: derivedNumericRisk,
    selectedRegion: backendToUiRegion[aiResults?.target_region] || assessment.selected_roi,
  };
}

export function toApiBiomarkers(biomarkers = {}) {
  const getNum = (val, fallback = 0) => {
    if (val === '' || val === null || val === undefined) return fallback;
    const n = Number(val);
    return Number.isFinite(n) ? n : fallback;
  };

  return {
    Calcium: getNum(biomarkers.calcium?.value ?? biomarkers.Calcium, 9.0),
    'Vitamin D': getNum(biomarkers.vitaminD?.value ?? biomarkers['Vitamin D'], 30),
    PTH: getNum(biomarkers.pth?.value ?? biomarkers.PTH, 65),
    Phosphate: getNum(biomarkers.phosphate?.value ?? biomarkers.Phosphate, 3.5),
    ALP: getNum(biomarkers.alp?.value ?? biomarkers.ALP, 80),
    CTX: getNum(biomarkers.ctx?.value ?? biomarkers.CTX, 300),
  };
}

