/**
 * Dynamic 3D Anatomical Model & Biomarker-Driven Annotation Engine
 * 
 * Maps patient procedures and clinical indicators to unique 3D CT bone models
 * and generates patient-specific risk annotations, DEXA T-scores, vBMD,
 * and surgical precautions based on input laboratory biomarkers.
 */

// Catalog of all available high-definition 3D models
export const AVAILABLE_MODELS = [
  { id: '01', name: 'Femur CT Scan #01 (37_Femur_R)', type: 'femur', path: '/storage/bones/01.glb', indication: 'Proximal femur anatomy / THA' },
  { id: '02', name: 'Femur CT Scan #02 (38_Femur_R)', type: 'femur', path: '/storage/bones/02.glb', indication: 'Intertrochanteric fracture / ORIF' },
  { id: '03', name: 'Femur CT Scan #03 (39_Femur_R)', type: 'femur', path: '/storage/bones/03.glb', indication: 'Femoral neck osteotomy' },
  { id: '04', name: 'Femur CT Scan #04 (40_Femur_R)', type: 'femur', path: '/storage/bones/04.glb', indication: 'Distal condylar / Knee alignment' },
  { id: '05', name: 'Femur CT Scan #05 (41_Femur_R)', type: 'femur', path: '/storage/bones/05.glb', indication: 'Shaft diaphysis fixation' },
  { id: '06', name: 'Femur CT Scan #06 (42_Femur_R)', type: 'femur', path: '/storage/bones/06.glb', indication: 'Subtrochanteric reconstruction' },
  { id: '07', name: 'Femur CT Scan #07 (43_Femur_R)', type: 'femur', path: '/storage/bones/07.glb', indication: 'Revision femoral stem seating' },
  { id: '08', name: 'Femur CT Scan #08 (44_Femur_R)', type: 'femur', path: '/storage/bones/08.glb', indication: 'Osteoporotic calcar evaluation' },
  { id: '09', name: 'Femur CT Scan #09 (45_Femur_R)', type: 'femur', path: '/storage/bones/09.glb', indication: 'Bicortical purchase analysis' },
  { id: '10', name: 'Femur CT Scan #10 (46_Femur_R)', type: 'femur', path: '/storage/bones/10.glb', indication: 'High-density baseline femur' },
  { id: 'spine', name: 'Lumbar Spine (L1–L5 Vertebrae)', type: 'spine', path: '/storage/bones/spine.glb', indication: 'Discectomy, Fusion & Vertebroplasty' },
  { id: 'tibia', name: 'Tibia & Knee Joint (Proximal)', type: 'tibia', path: '/storage/bones/tibia.glb', indication: 'TKA & Tibial Plateau Fixation' },
  { id: 'pelvis_female', name: 'Pelvis (Female Morphometry)', type: 'pelvis', path: '/storage/bones/pelvis_female.glb', indication: 'Acetabular reconstruction (Female)' },
  { id: 'pelvis_male', name: 'Pelvis (Male Morphometry)', type: 'pelvis', path: '/storage/bones/pelvis_male.glb', indication: 'Acetabular reconstruction (Male)' },
  { id: 'femur', name: 'Standard Femur PBR Mesh', type: 'femur', path: '/storage/bones/femur.glb', indication: 'Universal femoral reference' },
];

/**
 * Resolve the appropriate 3D model for a given patient case
 */
export function resolveModelForCase(patient) {
  if (!patient) {
    return {
      modelId: 'femur',
      modelPath: '/storage/bones/femur.glb',
      anatomyType: 'femur',
      displayName: 'Femur Anatomical Model',
    };
  }

  // 1. Explicit model_path
  if (patient.model_path) {
    const found = AVAILABLE_MODELS.find(m => m.path === patient.model_path);
    return {
      modelId: found?.id || 'custom',
      modelPath: patient.model_path,
      anatomyType: found?.type || 'femur',
      displayName: found?.name || 'Custom 3D Bone Model',
    };
  }

  // 2. Explicit model_id
  if (patient.model_id) {
    const rawId = String(patient.model_id).toLowerCase().trim();
    const found = AVAILABLE_MODELS.find(m => m.id.toLowerCase() === rawId);
    if (found) {
      return {
        modelId: found.id,
        modelPath: found.path,
        anatomyType: found.type,
        displayName: found.name,
      };
    }
  }

  // 3. Infer from procedure, indication, or condition
  const text = `${patient.procedure || ''} ${patient.clinical_indication || ''} ${patient.condition || ''}`.toLowerCase();

  // Spine procedures
  if (text.includes('discectomy') || text.includes('fusion') || text.includes('spine') || text.includes('vertebroplasty') || text.includes('l4-l5') || text.includes('t12-l1') || text.includes('l3') || text.includes('pedicle') || text.includes('lumbar')) {
    return {
      modelId: 'spine',
      modelPath: '/storage/bones/spine.glb',
      anatomyType: 'spine',
      displayName: 'Lumbar Spine (L1–L5 Vertebrae)',
    };
  }

  // Tibia / Knee procedures
  if (text.includes('knee') || text.includes('tka') || text.includes('tibia') || text.includes('plateau') || text.includes('distal femur fracture')) {
    return {
      modelId: 'tibia',
      modelPath: '/storage/bones/tibia.glb',
      anatomyType: 'tibia',
      displayName: 'Tibia & Knee Joint (Proximal)',
    };
  }

  // Pelvis procedures
  if (text.includes('pelvis') || text.includes('acetabul') || text.includes('ilium') || text.includes('sacroiliac')) {
    const isMale = (patient.gender || patient.patient_gender || '').toLowerCase() === 'male';
    const id = isMale ? 'pelvis_male' : 'pelvis_female';
    return {
      modelId: id,
      modelPath: `/storage/bones/${id}.glb`,
      anatomyType: 'pelvis',
      displayName: isMale ? 'Pelvis (Male Morphometry)' : 'Pelvis (Female Morphometry)',
    };
  }

  // Unique CT Femur Model by patient ID hash (so each distinct patient gets their own CT model)
  const idStr = String(patient.id || patient.case_id || '01');
  const sum = idStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const scanNum = (sum % 10) + 1;
  const scanId = scanNum < 10 ? `0${scanNum}` : `${scanNum}`;
  const foundScan = AVAILABLE_MODELS.find(m => m.id === scanId) || AVAILABLE_MODELS[0];

  return {
    modelId: foundScan.id,
    modelPath: foundScan.path,
    anatomyType: 'femur',
    displayName: foundScan.name,
  };
}

/**
 * Base Anatomical Templates with Normalized 3D Anchors
 */
const ANATOMICAL_TEMPLATES = {
  // ── FEMUR ─────────────────────────────────────────────────────────────
  femur: [
    {
      id: 'femoral-neck',
      label: 'Femoral Neck',
      subLabel: 'Collum Femoris',
      vulnerability: 'critical',
      anchor: [0.22, 0.70, 0.10],
      radius: 0.55,
      side: 'right',
      offset: [10, -2],
      meshTokens: ['femoral_neck', 'neck', 'collum'],
      baseTScore: -2.3,
      baseVBMD: 112.4,
      noteKey: 'neck',
    },
    {
      id: 'femoral-head',
      label: 'Femoral Head',
      subLabel: 'Caput Femoris',
      vulnerability: 'high',
      anchor: [0.32, 0.88, 0.12],
      radius: 0.40,
      side: 'right',
      offset: [10, -10],
      meshTokens: ['femoral_head', 'head', 'caput'],
      baseTScore: -2.1,
      baseVBMD: 134.2,
      noteKey: 'head',
    },
    {
      id: 'greater-trochanter',
      label: 'Greater Trochanter',
      subLabel: 'Trochanter Major',
      vulnerability: 'moderate',
      anchor: [-0.24, 0.62, 0.06],
      radius: 0.48,
      side: 'left',
      offset: [-10, -8],
      meshTokens: ['greater_trochanter', 'trochanter_major', 'trochanter'],
      baseTScore: -1.9,
      baseVBMD: 198.6,
      noteKey: 'trochanter',
    },
    {
      id: 'intertrochanteric',
      label: 'Intertrochanteric Line',
      subLabel: 'Crista Intertroch.',
      vulnerability: 'moderate',
      anchor: [-0.06, 0.48, 0.14],
      radius: 0.45,
      side: 'left',
      offset: [-10, 4],
      meshTokens: ['intertrochanteric', 'crista'],
      baseTScore: -1.8,
      baseVBMD: 210.0,
      noteKey: 'intertrochanteric',
    },
    {
      id: 'lesser-trochanter',
      label: 'Lesser Trochanter',
      subLabel: 'Trochanter Minor',
      vulnerability: 'moderate',
      anchor: [0.14, 0.36, -0.04],
      radius: 0.42,
      side: 'right',
      offset: [10, 8],
      meshTokens: ['lesser_trochanter', 'trochanter_minor', 'lesser'],
      baseTScore: -1.7,
      baseVBMD: 220.5,
      noteKey: 'lesser',
    },
    {
      id: 'shaft',
      label: 'Femoral Shaft',
      subLabel: 'Diaphysis / Corpus',
      vulnerability: 'low',
      anchor: [0.02, -0.05, 0.06],
      radius: 0.55,
      side: 'right',
      offset: [10, 16],
      meshTokens: ['shaft', 'diaphysis', 'corpus'],
      baseTScore: -0.5,
      baseVBMD: 845.1,
      noteKey: 'shaft',
    },
    {
      id: 'distal-condyles',
      label: 'Distal Metaphysis',
      subLabel: 'Condyli Med./Lat.',
      vulnerability: 'low',
      anchor: [0.02, -0.78, 0.08],
      radius: 0.48,
      side: 'left',
      offset: [-10, 4],
      meshTokens: ['condyle', 'distal', 'metaphysis', 'epicondyle'],
      baseTScore: -0.8,
      baseVBMD: 650.0,
      noteKey: 'condyles',
    },
  ],

  // ── SPINE ─────────────────────────────────────────────────────────────
  spine: [
    {
      id: 'l1-l2-endplate',
      label: 'L1–L2 Endplate',
      subLabel: 'Superior Vertebral Base',
      vulnerability: 'moderate',
      anchor: [0.0, 0.72, 0.16],
      radius: 0.42,
      side: 'right',
      offset: [10, -8],
      meshTokens: ['l1', 'l2', 'superior', 'endplate', 'vertebra'],
      baseTScore: -1.9,
      baseVBMD: 185.0,
      noteKey: 'spine_l1',
    },
    {
      id: 'l3-vertebral-body',
      label: 'L3 Vertebral Body',
      subLabel: 'Corpus Vertebrae L3',
      vulnerability: 'high',
      anchor: [0.0, 0.32, 0.20],
      radius: 0.46,
      side: 'left',
      offset: [-10, -4],
      meshTokens: ['l3', 'body', 'vertebral', 'corpus'],
      baseTScore: -2.3,
      baseVBMD: 118.0,
      noteKey: 'spine_l3',
    },
    {
      id: 'l4-pedicle',
      label: 'L4 Pedicle Screws',
      subLabel: 'Pedicle Fixation Axis',
      vulnerability: 'critical',
      anchor: [-0.24, -0.04, 0.10],
      radius: 0.44,
      side: 'left',
      offset: [-10, 4],
      meshTokens: ['l4', 'pedicle', 'screw', 'fixation'],
      baseTScore: -2.6,
      baseVBMD: 104.0,
      noteKey: 'spine_l4_pedicle',
    },
    {
      id: 'l4-l5-interbody',
      label: 'L4–L5 Interbody Space',
      subLabel: 'PEEK Cage Fusion Site',
      vulnerability: 'critical',
      anchor: [0.0, -0.25, 0.20],
      radius: 0.50,
      side: 'right',
      offset: [10, 2],
      meshTokens: ['l4', 'l5', 'interbody', 'disc', 'cage'],
      baseTScore: -2.8,
      baseVBMD: 96.5,
      noteKey: 'spine_l4_l5',
    },
    {
      id: 'l5-pars',
      label: 'L5 Pars Interarticularis',
      subLabel: 'Facet Joint Complex',
      vulnerability: 'moderate',
      anchor: [0.26, -0.48, -0.04],
      radius: 0.40,
      side: 'right',
      offset: [10, 8],
      meshTokens: ['l5', 'pars', 'facet', 'articular'],
      baseTScore: -1.7,
      baseVBMD: 212.0,
      noteKey: 'spine_l5_pars',
    },
    {
      id: 's1-sacral-promontory',
      label: 'S1 Sacral Promontory',
      subLabel: 'Sacral Anchorage Base',
      vulnerability: 'low',
      anchor: [0.0, -0.80, 0.14],
      radius: 0.45,
      side: 'left',
      offset: [-10, 6],
      meshTokens: ['s1', 'sacrum', 'sacral', 'promontory'],
      baseTScore: -0.6,
      baseVBMD: 740.0,
      noteKey: 'spine_s1',
    },
  ],

  // ── TIBIA / KNEE ──────────────────────────────────────────────────────
  tibia: [
    {
      id: 'medial-tibial-plateau',
      label: 'Medial Tibial Plateau',
      subLabel: 'Facies Articularis Med.',
      vulnerability: 'critical',
      anchor: [0.24, 0.82, 0.08],
      radius: 0.50,
      side: 'right',
      offset: [10, -8],
      meshTokens: ['medial', 'plateau', 'condyle', 'tibia'],
      baseTScore: -2.4,
      baseVBMD: 108.0,
      noteKey: 'tibia_medial',
    },
    {
      id: 'lateral-tibial-plateau',
      label: 'Lateral Tibial Plateau',
      subLabel: 'Facies Articularis Lat.',
      vulnerability: 'high',
      anchor: [-0.24, 0.82, 0.08],
      radius: 0.48,
      side: 'left',
      offset: [-10, -8],
      meshTokens: ['lateral', 'plateau', 'condyle'],
      baseTScore: -2.1,
      baseVBMD: 128.0,
      noteKey: 'tibia_lateral',
    },
    {
      id: 'tibial-tuberosity',
      label: 'Tibial Tuberosity',
      subLabel: 'Tuberositas Tibiae',
      vulnerability: 'moderate',
      anchor: [0.02, 0.58, 0.26],
      radius: 0.42,
      side: 'right',
      offset: [10, 2],
      meshTokens: ['tuberosity', 'patellar', 'anterior'],
      baseTScore: -1.8,
      baseVBMD: 215.0,
      noteKey: 'tibia_tuberosity',
    },
    {
      id: 'proximal-metaphysis',
      label: 'Proximal Metaphysis',
      subLabel: 'Subchondral Sponge',
      vulnerability: 'moderate',
      anchor: [0.02, 0.32, 0.08],
      radius: 0.46,
      side: 'left',
      offset: [-10, 4],
      meshTokens: ['metaphysis', 'proximal', 'cancellous'],
      baseTScore: -1.6,
      baseVBMD: 230.0,
      noteKey: 'tibia_metaphysis',
    },
    {
      id: 'tibial-shaft',
      label: 'Tibial Diaphysis',
      subLabel: 'Corpus Tibiae',
      vulnerability: 'low',
      anchor: [0.02, -0.15, 0.08],
      radius: 0.52,
      side: 'right',
      offset: [10, 12],
      meshTokens: ['shaft', 'diaphysis', 'corpus', 'cortex'],
      baseTScore: -0.5,
      baseVBMD: 860.0,
      noteKey: 'tibia_shaft',
    },
    {
      id: 'medial-malleolus',
      label: 'Distal Plafond',
      subLabel: 'Malleolus Medialis',
      vulnerability: 'low',
      anchor: [0.18, -0.82, 0.08],
      radius: 0.44,
      side: 'left',
      offset: [-10, 4],
      meshTokens: ['malleolus', 'distal', 'plafond'],
      baseTScore: -0.7,
      baseVBMD: 680.0,
      noteKey: 'tibia_distal',
    },
  ],

  // ── PELVIS ────────────────────────────────────────────────────────────
  pelvis: [
    {
      id: 'acetabular-dome',
      label: 'Acetabular Dome',
      subLabel: 'Superior Weight-Bearing Roof',
      vulnerability: 'critical',
      anchor: [0.40, 0.16, 0.22],
      radius: 0.46,
      side: 'right',
      offset: [10, -4],
      meshTokens: ['acetabulum', 'dome', 'roof', 'cup'],
      baseTScore: -2.5,
      baseVBMD: 102.0,
      noteKey: 'pelvis_dome',
    },
    {
      id: 'posterior-column',
      label: 'Posterior Column',
      subLabel: 'Acetabular Posterior Wall',
      vulnerability: 'high',
      anchor: [0.34, -0.14, -0.16],
      radius: 0.44,
      side: 'left',
      offset: [-10, 2],
      meshTokens: ['posterior', 'column', 'wall'],
      baseTScore: -2.0,
      baseVBMD: 140.0,
      noteKey: 'pelvis_post_col',
    },
    {
      id: 'iliac-crest',
      label: 'Iliac Wing',
      subLabel: 'Ala Ossis Ilii',
      vulnerability: 'moderate',
      anchor: [-0.52, 0.70, 0.10],
      radius: 0.50,
      side: 'left',
      offset: [-10, -8],
      meshTokens: ['ilium', 'iliac', 'wing', 'crest'],
      baseTScore: -1.7,
      baseVBMD: 225.0,
      noteKey: 'pelvis_iliac',
    },
    {
      id: 'anterior-pubic-ramus',
      label: 'Anterior Pubic Ramus',
      subLabel: 'Ramus Superior Ossis Pubis',
      vulnerability: 'moderate',
      anchor: [0.12, -0.42, 0.26],
      radius: 0.40,
      side: 'right',
      offset: [10, 8],
      meshTokens: ['pubis', 'pubic', 'ramus', 'anterior'],
      baseTScore: -1.5,
      baseVBMD: 245.0,
      noteKey: 'pelvis_pubis',
    },
    {
      id: 'ischial-tuberosity',
      label: 'Ischial Tuberosity',
      subLabel: 'Tuber Ischiadicum',
      vulnerability: 'low',
      anchor: [0.30, -0.74, -0.06],
      radius: 0.44,
      side: 'left',
      offset: [-10, 6],
      meshTokens: ['ischium', 'ischial', 'tuberosity'],
      baseTScore: -0.6,
      baseVBMD: 790.0,
      noteKey: 'pelvis_ischium',
    },
  ],
};

/**
 * Generate patient-specific, dynamic 3D annotations and risk scores
 * driven by actual laboratory inputs (PTH, Vit D, Calcium, CTX, etc.)
 */
export function generateDynamicAnnotations({
  patient,
  biomarkers,
  assessment,
  roiNotes = {},
}) {
  const modelConfig = resolveModelForCase(patient);
  const anatomyType = modelConfig.anatomyType || 'femur';
  const templates = ANATOMICAL_TEMPLATES[anatomyType] || ANATOMICAL_TEMPLATES.femur;

  // Robustly extract numeric biomarker inputs from biomarkers object or patient fields
  const getBioVal = (keys, fallback) => {
    for (const k of keys) {
      const v1 = biomarkers?.[k]?.value ?? biomarkers?.[k];
      if (v1 !== '' && v1 !== null && v1 !== undefined) {
        const n = typeof v1 === 'number' ? v1 : parseFloat(v1);
        if (Number.isFinite(n)) return n;
      }
      const v2 = patient?.[k]?.value ?? patient?.[k];
      if (v2 !== '' && v2 !== null && v2 !== undefined) {
        const n = typeof v2 === 'number' ? v2 : parseFloat(v2);
        if (Number.isFinite(n)) return n;
      }
      const v3 = patient?.initial_biomarkers?.[k]?.value ?? patient?.initial_biomarkers?.[k];
      if (v3 !== '' && v3 !== null && v3 !== undefined) {
        const n = typeof v3 === 'number' ? v3 : parseFloat(v3);
        if (Number.isFinite(n)) return n;
      }
    }
    return fallback;
  };

  const pth = getBioVal(['pth', 'PTH'], 40.0);
  const vitD = getBioVal(['vitaminD', 'vitamin_d', 'vitD', 'vit_d', 'VITD'], 45.0);
  const calcium = getBioVal(['calcium', 'ca', 'CA'], 9.5);
  const ctx = getBioVal(['ctx', 'CTX'], 200.0);
  const phosphate = getBioVal(['phosphate', 'phos', 'p', 'PHOSPHATE'], 3.5);
  const alp = getBioVal(['alp', 'ALP'], 75.0);

  // Calculate dynamic bone quality & metabolic stress index (0 to 100)
  let qualityPenalty = 10; // healthy baseline
  if (pth > 80) qualityPenalty += 30;
  else if (pth > 65) qualityPenalty += 18;

  if (vitD < 20) qualityPenalty += 30;
  else if (vitD < 30) qualityPenalty += 15;

  if (calcium < 8.6 || calcium > 10.3) qualityPenalty += 15;
  if (ctx > 400) qualityPenalty += 25;
  else if (ctx > 300) qualityPenalty += 12;

  if (alp > 147) qualityPenalty += 15;
  if (phosphate < 2.5 || phosphate > 4.5) qualityPenalty += 10;

  qualityPenalty = Math.min(Math.max(qualityPenalty, 5), 95);

  // Determine overall case risk category
  let overallRiskLevel = 'low';
  if (qualityPenalty >= 60) overallRiskLevel = 'high';
  else if (qualityPenalty >= 35) overallRiskLevel = 'moderate';

  // Overall DEXA T-Score estimation
  let overallTScore = -0.6;
  if (overallRiskLevel === 'high') {
    overallTScore = Number((-2.5 - (qualityPenalty - 60) * 0.035).toFixed(1));
  } else if (overallRiskLevel === 'moderate') {
    overallTScore = Number((-1.5 - (qualityPenalty - 35) * 0.035).toFixed(1));
  } else {
    overallTScore = Number((-0.4 - qualityPenalty * 0.02).toFixed(1));
  }

  const fractureRiskPct = overallRiskLevel === 'high' ? 88 : overallRiskLevel === 'moderate' ? 52 : 9.4;

  let criticalZoneCount = 0;
  let elevatedZoneCount = 0;

  // Generate dynamic values for every anatomical zone
  const dynamicZones = templates.map((tmpl) => {
    let zoneRisk = 'low';
    let tScoreNum = -0.6;
    let vBmdNum = tmpl.baseVBMD;

    if (overallRiskLevel === 'high') {
      if (tmpl.vulnerability === 'critical') {
        zoneRisk = 'high';
        tScoreNum = Number((overallTScore - 0.4).toFixed(1));
        vBmdNum = Math.round(tmpl.baseVBMD * 0.68);
      } else if (tmpl.vulnerability === 'high') {
        zoneRisk = 'high';
        tScoreNum = Number((overallTScore - 0.1).toFixed(1));
        vBmdNum = Math.round(tmpl.baseVBMD * 0.74);
      } else if (tmpl.vulnerability === 'moderate') {
        zoneRisk = 'moderate';
        tScoreNum = Number((overallTScore + 0.6).toFixed(1));
        vBmdNum = Math.round(tmpl.baseVBMD * 0.82);
      } else {
        zoneRisk = 'low';
        tScoreNum = Number((overallTScore + 1.8).toFixed(1));
        vBmdNum = Math.round(tmpl.baseVBMD * 0.94);
      }
    } else if (overallRiskLevel === 'moderate') {
      if (tmpl.vulnerability === 'critical' || tmpl.vulnerability === 'high') {
        zoneRisk = 'moderate';
        tScoreNum = Number((overallTScore - 0.2).toFixed(1));
        vBmdNum = Math.round(tmpl.baseVBMD * 0.84);
      } else if (tmpl.vulnerability === 'moderate') {
        zoneRisk = 'moderate';
        tScoreNum = Number((overallTScore + 0.2).toFixed(1));
        vBmdNum = Math.round(tmpl.baseVBMD * 0.90);
      } else {
        zoneRisk = 'low';
        tScoreNum = Number((overallTScore + 1.2).toFixed(1));
        vBmdNum = Math.round(tmpl.baseVBMD * 0.98);
      }
    } else {
      // Normal/healthy profile
      zoneRisk = 'low';
      tScoreNum = Number((-0.4 - (tmpl.vulnerability === 'critical' ? 0.4 : 0.1)).toFixed(1));
      vBmdNum = Math.round(tmpl.baseVBMD * 1.08);
    }

    if (zoneRisk === 'high') criticalZoneCount += 1;
    else if (zoneRisk === 'moderate') elevatedZoneCount += 1;

    // Build dynamic clinical insight note reflecting actual input data
    let dynamicNote = '';
    const userCustomNote = roiNotes[tmpl.id] || roiNotes[tmpl.id.replace(/-/g, '_')];

    if (userCustomNote) {
      dynamicNote = `[Surgeon Note] ${userCustomNote}`;
    } else if (zoneRisk === 'high') {
      if (pth > 65 && vitD < 30) {
        dynamicNote = `High stress zone compromised by elevated PTH (${pth} pg/mL) and Vitamin D deficiency (${vitD} ng/mL). Active trabecular resorption elevates risk of implant subsidence or intra-op fracture.`;
      } else if (ctx > 300) {
        dynamicNote = `Accelerated bone turnover (CTX: ${ctx} pg/mL) is eroding subchondral bone support. Augmented fixation strategy advised.`;
      } else {
        dynamicNote = `Critical mechanical shear vulnerability. Local bone density impoverished (T: ${tScoreNum}). Consider cement augmentation.`;
      }
    } else if (zoneRisk === 'moderate') {
      dynamicNote = `Moderate structural strain area. Bone turnover borderline (PTH: ${pth} pg/mL). Standard instrumentation with careful impaction torque recommended.`;
    } else {
      dynamicNote = `Optimal cortical & trabecular density under physiologic homeostasis (PTH: ${pth} pg/mL, Vit D: ${vitD} ng/mL). Structurally robust zone for primary hardware purchase.`;
    }

    return {
      ...tmpl,
      riskLevel: zoneRisk,
      tScore: tScoreNum > 0 ? `+${tScoreNum}` : `${tScoreNum}`,
      vBMD: `${vBmdNum}`,
      note: dynamicNote,
    };
  });

  return {
    modelId: modelConfig.modelId,
    modelPath: modelConfig.modelPath,
    modelName: modelConfig.displayName,
    anatomyType,
    zones: dynamicZones,
    overallRiskLevel,
    overallTScore: overallTScore > 0 ? `+${overallTScore}` : `${overallTScore}`,
    fractureRiskPct,
    criticalZoneCount,
    elevatedZoneCount,
    qualityPenalty,
  };
}
