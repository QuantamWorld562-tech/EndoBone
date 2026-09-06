import { describe, it, expect } from 'vitest';
import { computeDynamicAssessment } from '../../context/PatientDataContext';
import { generateDynamicAnnotations } from '../../utils/modelAnnotationEngine';
import { toUiPatient } from '../apiAdapters';

describe('AI Validation & UI Reflection Workflow', () => {
  it('validates high-risk input data and reflects elevated quality risk and pathways for AI Assessment', () => {
    const rawHighRiskBiomarkers = {
      pth: { value: 78.5 },
      vitaminD: { value: 16.2 },
      calcium: { value: 8.2 },
      phosphate: { value: 4.8 },
      alp: { value: 155 },
      ctx: { value: 420 },
    };

    const assessment = computeDynamicAssessment('test-pt-1', rawHighRiskBiomarkers);

    // AI validation produces high quality risk (>65)
    expect(assessment.overallQualityRisk).toBeGreaterThanOrEqual(65);
    // AI recommends augmented fixation and metabolic suppression
    expect(assessment.insights.some(i => i.severity === 'high')).toBe(true);
    expect(assessment.recommendedPathway.length).toBeGreaterThan(0);
    expect(assessment.clinicalNotes).toContain('High metabolic risk');
  });

  it('validates normal input data and reflects low risk tier for AI Assessment', () => {
    const rawNormalBiomarkers = {
      pth: { value: 38.0 },
      vitaminD: { value: 48.0 },
      calcium: { value: 9.5 },
      phosphate: { value: 3.4 },
      alp: { value: 72 },
      ctx: { value: 180 },
    };

    const assessment = computeDynamicAssessment('test-pt-2', rawNormalBiomarkers);

    // AI validation produces low risk (<40)
    expect(assessment.overallQualityRisk).toBeLessThan(40);
    expect(assessment.clinicalNotes).toContain('Low metabolic risk');
  });

  it('reflects validated biomarkers dynamically in 3D Planning with model-specific zones and T-scores', () => {
    const highRiskBiomarkers = {
      pth: { value: 85.0 },
      vitaminD: { value: 15.0 },
      calcium: { value: 8.1 },
      phosphate: { value: 4.9 },
      alp: { value: 160 },
      ctx: { value: 450 },
    };

    const spinePatient = {
      id: 'PEB-SPINE-1',
      procedure: 'L4-L5 Discectomy & Fusion',
      model_id: 'spine',
    };

    const dynamic3D = generateDynamicAnnotations({
      patient: spinePatient,
      biomarkers: highRiskBiomarkers,
    });

    expect(dynamic3D.anatomyType).toBe('spine');
    expect(dynamic3D.overallRiskLevel).toBe('high');
    expect(dynamic3D.zones.length).toBeGreaterThanOrEqual(3);
    // Verify spine zone vulnerability and dynamic risk levels
    const l3Zone = dynamic3D.zones.find(z => z.id === 'l3-vertebral-body');
    expect(l3Zone).toBeDefined();
    expect(l3Zone.riskLevel).toBe('high');
    expect(parseFloat(l3Zone.tScore)).toBeLessThan(-2.0);
  });

  it('reflects validated biomarkers dynamically in Pre-Surgical Summary risk zones', () => {
    const hipPatient = {
      id: 'PEB-HIP-1',
      procedure: 'Total Hip Arthroplasty (THA)',
      model_id: '01',
    };

    const dynamicHip = generateDynamicAnnotations({
      patient: hipPatient,
      biomarkers: {
        pth: { value: 85.0 },
        vitaminD: { value: 16.0 },
        ctx: { value: 520 },
      },
    });

    // In Pre-Surgical Summary, zones are derived dynamically
    const summaryZones = dynamicHip.zones.map(z => ({
      label: z.label,
      risk: (z.riskLevel || 'LOW').toUpperCase(),
      tscore: z.tScore,
    }));

    expect(summaryZones.length).toBeGreaterThan(0);
    expect(summaryZones[0].risk).toBe('HIGH');
    expect(summaryZones.some(z => z.label.includes('Neck') || z.label.includes('Femoral'))).toBe(true);
  });

  it('maps scheduled_date through toUiPatient and formats properly', () => {
    const rawBackendCase = {
      case_id: 'PEB-9021-F',
      patient_name: 'Anita Roy',
      patient_age: 62,
      patient_gender: 'Female',
      clinical_indication: 'Total Hip Arthroplasty (THA)',
      scheduled_date: '2026-10-24',
    };

    const uiPatient = toUiPatient(rawBackendCase);
    expect(uiPatient.scheduledDate).toBe('2026-10-24');

    // Test clinical date formatting
    const [y, m, d] = uiPatient.scheduledDate.split('-');
    const formatted = new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    expect(formatted).toBe('Oct 24, 2026');
  });
});
