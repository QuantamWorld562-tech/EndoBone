export const REVISION_CHECKLISTS = {
  r_tha: {
    id: 'r_tha',
    name: 'Revision Total Hip Arthroplasty',
    title: 'Revision Implant & Fixation Checklist',
    items: [
      { id: 'r_th1', name: 'Revision Femoral Stem', defaultSelected: true },
      { id: 'r_th2', name: 'Revision Acetabular Cup/Shell', defaultSelected: true },
      { id: 'r_th3', name: 'Acetabular Augment', defaultSelected: false, riskTrigger: 'moderate' },
      { id: 'r_th4', name: 'Acetabular Fixation Screws', defaultSelected: true },
      { id: 'r_th5', name: 'Femoral Head', defaultSelected: true },
      { id: 'r_th6', name: 'Revision Liner', defaultSelected: true },
      { id: 'r_th7', name: 'Bone Void Filler/Graft', defaultSelected: false, riskTrigger: 'high' },
    ],
  },
  r_tka: {
    id: 'r_tka',
    name: 'Revision Total Knee Arthroplasty',
    title: 'Revision Implant & Fixation Checklist',
    items: [
      { id: 'r_tk1', name: 'Revision Femoral Component', defaultSelected: true },
      { id: 'r_tk2', name: 'Revision Tibial Component', defaultSelected: true },
      { id: 'r_tk3', name: 'Stem Extensions', defaultSelected: true },
      { id: 'r_tk4', name: 'Femoral/Tibial Augments', defaultSelected: false, riskTrigger: 'moderate' },
      { id: 'r_tk5', name: 'Revision Polyethylene Insert', defaultSelected: true },
      { id: 'r_tk6', name: 'Constraint/Constrained Insert', defaultSelected: false, riskTrigger: 'moderate' },
      { id: 'r_tk7', name: 'Bone Void Filler/Graft', defaultSelected: false, riskTrigger: 'high' },
    ],
  },
};
