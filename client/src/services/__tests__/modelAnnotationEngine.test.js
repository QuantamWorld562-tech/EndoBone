import { describe, it, expect } from 'vitest';
import {
  resolveModelForCase,
  generateDynamicAnnotations,
  AVAILABLE_MODELS,
} from '../../utils/modelAnnotationEngine';

describe('Model & Annotation Engine', () => {
  it('has valid catalog of 3D models including 10 CT scans, spine, tibia, and pelvis', () => {
    expect(AVAILABLE_MODELS.length).toBeGreaterThanOrEqual(14);
    expect(AVAILABLE_MODELS.some((m) => m.id === 'spine')).toBe(true);
    expect(AVAILABLE_MODELS.some((m) => m.id === 'tibia')).toBe(true);
    expect(AVAILABLE_MODELS.some((m) => m.id === '01')).toBe(true);
    expect(AVAILABLE_MODELS.some((m) => m.id === '10')).toBe(true);
  });

  it('resolves unique models based on procedure and indication', () => {
    const spineCase = resolveModelForCase({ procedure: 'L4-L5 Discectomy & Fusion' });
    expect(spineCase.anatomyType).toBe('spine');
    expect(spineCase.modelPath).toBe('/storage/bones/spine.glb');

    const kneeCase = resolveModelForCase({ procedure: 'Total Knee Arthroplasty (TKA)' });
    expect(kneeCase.anatomyType).toBe('tibia');
    expect(kneeCase.modelPath).toBe('/storage/bones/tibia.glb');

    const pelvisCase = resolveModelForCase({ procedure: 'Acetabular Reconstruction', gender: 'Female' });
    expect(pelvisCase.anatomyType).toBe('pelvis');
    expect(pelvisCase.modelPath).toContain('pelvis_female.glb');

    const explicitModelCase = resolveModelForCase({ model_id: '04' });
    expect(explicitModelCase.modelId).toBe('04');
    expect(explicitModelCase.modelPath).toBe('/storage/bones/04.glb');
  });

  it('generates high-risk annotations and worsened T-Scores for severe biomarker input', () => {
    const severeBiomarkers = {
      pth: { value: 85.0 },
      vitaminD: { value: 16.0 },
      calcium: { value: 8.2 },
      ctx: { value: 520 },
    };

    const result = generateDynamicAnnotations({
      patient: { id: 'TEST-HIGH', procedure: 'Total Hip Arthroplasty (THA)' },
      biomarkers: severeBiomarkers,
    });

    expect(result.overallRiskLevel).toBe('high');
    expect(parseFloat(result.overallTScore)).toBeLessThanOrEqual(-2.5);
    expect(result.criticalZoneCount).toBeGreaterThanOrEqual(1);

    const neckZone = result.zones.find((z) => z.id === 'femoral-neck');
    expect(neckZone).toBeDefined();
    expect(neckZone.riskLevel).toBe('high');
    expect(parseFloat(neckZone.tScore)).toBeLessThan(-2.5);
    expect(neckZone.note).toContain('PTH');
  });

  it('generates low-risk annotations and healthy T-Scores for normal biomarker input', () => {
    const healthyBiomarkers = {
      pth: { value: 35.0 },
      vitaminD: { value: 48.0 },
      calcium: { value: 9.6 },
      ctx: { value: 180 },
    };

    const result = generateDynamicAnnotations({
      patient: { id: 'TEST-LOW', procedure: 'Total Hip Arthroplasty (THA)' },
      biomarkers: healthyBiomarkers,
    });

    expect(result.overallRiskLevel).toBe('low');
    expect(parseFloat(result.overallTScore)).toBeGreaterThan(-1.5);
    expect(result.criticalZoneCount).toBe(0);

    const neckZone = result.zones.find((z) => z.id === 'femoral-neck');
    expect(neckZone).toBeDefined();
    expect(neckZone.riskLevel).toBe('low');
    expect(neckZone.note).toContain('Optimal');
  });

  it('generates distinct anatomical landmarks for Spine vs Femur vs Tibia', () => {
    const spineResult = generateDynamicAnnotations({
      patient: { id: 'SPINE-1', procedure: 'L4-L5 Discectomy & Fusion' },
      biomarkers: {},
    });
    expect(spineResult.anatomyType).toBe('spine');
    expect(spineResult.zones.some((z) => z.id === 'l4-l5-interbody')).toBe(true);
    expect(spineResult.zones.some((z) => z.id === 'l4-pedicle')).toBe(true);

    const tibiaResult = generateDynamicAnnotations({
      patient: { id: 'TIBIA-1', procedure: 'Total Knee Arthroplasty (TKA)' },
      biomarkers: {},
    });
    expect(tibiaResult.anatomyType).toBe('tibia');
    expect(tibiaResult.zones.some((z) => z.id === 'medial-tibial-plateau')).toBe(true);
  });
});
