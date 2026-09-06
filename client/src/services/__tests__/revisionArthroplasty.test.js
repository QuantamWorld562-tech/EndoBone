import { describe, it, expect } from 'vitest';
import { REVISION_CHECKLISTS } from '../../constants/checklists';

describe('Revision Arthroplasty Checklists', () => {
  const revisionThaItems = REVISION_CHECKLISTS.r_tha.items.map((i) => i.name);
  const revisionTkaItems = REVISION_CHECKLISTS.r_tka.items.map((i) => i.name);

  it('has exact required title and items for Revision THA checklist', () => {
    expect(REVISION_CHECKLISTS.r_tha.title).toBe('Revision Implant & Fixation Checklist');
    expect(revisionThaItems).toEqual([
      'Revision Femoral Stem',
      'Revision Acetabular Cup/Shell',
      'Acetabular Augment',
      'Acetabular Fixation Screws',
      'Femoral Head',
      'Revision Liner',
      'Bone Void Filler/Graft',
    ]);
    expect(revisionThaItems.length).toBe(7);
  });

  it('has exact required title and items for Revision TKA checklist', () => {
    expect(REVISION_CHECKLISTS.r_tka.title).toBe('Revision Implant & Fixation Checklist');
    expect(revisionTkaItems).toEqual([
      'Revision Femoral Component',
      'Revision Tibial Component',
      'Stem Extensions',
      'Femoral/Tibial Augments',
      'Revision Polyethylene Insert',
      'Constraint/Constrained Insert',
      'Bone Void Filler/Graft',
    ]);
    expect(revisionTkaItems.length).toBe(7);
  });

  it('correctly maps default selections and risk triggers for Revision THA', () => {
    const tha = REVISION_CHECKLISTS.r_tha.items;
    const stem = tha.find(i => i.name === 'Revision Femoral Stem');
    const augment = tha.find(i => i.name === 'Acetabular Augment');
    const graft = tha.find(i => i.name === 'Bone Void Filler/Graft');

    expect(stem.defaultSelected).toBe(true);
    expect(augment.riskTrigger).toBe('moderate');
    expect(graft.riskTrigger).toBe('high');
  });

  it('correctly maps default selections and risk triggers for Revision TKA', () => {
    const tka = REVISION_CHECKLISTS.r_tka.items;
    const comp = tka.find(i => i.name === 'Revision Femoral Component');
    const constraint = tka.find(i => i.name === 'Constraint/Constrained Insert');
    const graft = tka.find(i => i.name === 'Bone Void Filler/Graft');

    expect(comp.defaultSelected).toBe(true);
    expect(constraint.riskTrigger).toBe('moderate');
    expect(graft.riskTrigger).toBe('high');
  });
});

