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
});
