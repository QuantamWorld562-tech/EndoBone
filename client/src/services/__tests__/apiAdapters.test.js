import { describe, it, expect } from 'vitest';
import {
  toApiRegion,
  toUiPatient,
  toUiAssessment,
  toApiBiomarkers,
} from '../apiAdapters';
import { readApiError } from '../authService';
import { computeDynamicAssessment } from '../../context/PatientDataContext';

describe('API Adapters & Utility Tests', () => {
  it('toApiRegion converts UI region keys to backend snake_case', () => {
    expect(toApiRegion('femoral-neck')).toBe('femoral_neck');
    expect(toApiRegion('greater-trochanter')).toBe('greater_trochanter');
    expect(toApiRegion('shaft')).toBe('shaft');
    expect(toApiRegion('proximal-femur')).toBe('femoral_neck');
  });

  it('toUiPatient normalizes case objects with fallback fields', () => {
    const raw = {
      case_id: 'PEB-1001-F',
      patient_name: 'Jane Doe',
      patient_age: 55,
      patient_gender: 'Female',
      procedure: 'Total Hip Arthroplasty (THA)',
    };
    const ui = toUiPatient(raw);
    expect(ui.id).toBe('PEB-1001-F');
    expect(ui.name).toBe('Jane Doe');
    expect(ui.age).toBe(55);
    expect(ui.gender).toBe('Female');
  });

  it('toUiAssessment extracts AI risk level and derives score', () => {
    const raw = {
      _id: 'assess_123',
      overallQualityRisk: 75,
      aiResults: {
        risk_level: 'high',
        target_region: 'femoral_neck',
      },
    };
    const ui = toUiAssessment(raw);
    expect(ui.id).toBe('assess_123');
    expect(ui.overallQualityRisk).toBe(75);
    expect(ui.selectedRegion).toBe('femoral-neck');
  });

  it('toApiBiomarkers maps nested object structure to API schema', () => {
    const biomarkers = {
      pth: { value: 85 },
      vitaminD: { value: 18 },
      calcium: { value: 8.2 },
      phosphate: { value: 3.1 },
      alp: { value: 120 },
      ctx: { value: 450 },
    };
    const mapped = toApiBiomarkers(biomarkers);
    expect(mapped.PTH).toBe(85);
    expect(mapped['Vitamin D']).toBe(18);
    expect(mapped.Calcium).toBe(8.2);
  });

  it('readApiError extracts FastAPI detail errors properly', () => {
    const errorWithDetail = {
      response: {
        data: { detail: 'An account with this email already exists.' },
      },
    };
    expect(readApiError(errorWithDetail, 'Fallback')).toBe(
      'An account with this email already exists.'
    );

    const errorWithPydanticMsg = {
      response: {
        data: { detail: [{ msg: 'Field required', loc: ['body', 'email'] }] },
      },
    };
    expect(readApiError(errorWithPydanticMsg, 'Fallback')).toBe('Field required');

    const emptyError = {};
    expect(readApiError(emptyError, 'Default message')).toBe('Default message');
  });

  it('computeDynamicAssessment calculates risk and metabolic insights', () => {
    const highRiskBiomarkers = {
      pth: { value: 88 },
      vitaminD: { value: 16 },
      calcium: { value: 8.2 },
      phosphate: { value: 2.8 },
      alp: { value: 110 },
      ctx: { value: 450 },
    };
    const res = computeDynamicAssessment('PEB-8842-A', highRiskBiomarkers);
    expect(res.overallQualityRisk).toBeGreaterThanOrEqual(65);
    expect(res.insights.length).toBeGreaterThan(0);
    expect(res.insights[0].severity).toBe('high');

    const normalBiomarkers = {
      pth: { value: 42 },
      vitaminD: { value: 45 },
      calcium: { value: 9.6 },
      phosphate: { value: 3.5 },
      alp: { value: 78 },
      ctx: { value: 210 },
    };
    const resNormal = computeDynamicAssessment('PEB-8840-C', normalBiomarkers);
    expect(resNormal.overallQualityRisk).toBeLessThan(40);
    expect(resNormal.dexa_tscore).toBeGreaterThan(-1.0);
  });
});
