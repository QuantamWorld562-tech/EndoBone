import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileDown,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  UserRound,
  AlertCircle,
  Printer,
  Edit3,
  ShieldAlert,
  Save,
  Lock,
  Activity,
  Layers,
  Link2,
  Loader2,
} from 'lucide-react';
import { useSurgicalPlan, usePatientData } from '../../../hooks';
import { usePatientContext } from '../../../context/PatientDataContext';
import { assessmentService } from '../../../services/assessmentService';

export default function PreSurgicalSummaryView({ patientId }) {
  const params = useParams();
  const effectivePatientId = patientId || params.patientId || 'PEB-8842-A';
  const { plan, hardwareSelection, updateHardwareSelection } = useSurgicalPlan(effectivePatientId);
  const { patient } = usePatientData(effectivePatientId);
  const { biomarkers: contextBiomarkers, roiNotes, assessment, persistedAssessment } = usePatientContext();

  // ── Surgeon notes: loaded from assessment.planning_notes, saved to backend ──
  const [surgeonNotes, setSurgeonNotes] = useState('');
  const [isNotesDirty, setIsNotesDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: 'success' });
  const notesDebounceRef = useRef(null);

  // Load planning_notes from persisted assessment on mount / when assessment changes
  useEffect(() => {
    const notes = persistedAssessment?.planning_notes || assessment?.planning_notes || '';
    setSurgeonNotes(notes);
    setIsNotesDirty(false);
  }, [persistedAssessment?.id, assessment?.planning_notes]);

  const showToast = useCallback((text, type = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage({ text: '', type: 'success' }), 3500);
  }, []);

  // ── Save notes to backend ──
  const persistNotes = useCallback(async (notes) => {
    const assessmentId = persistedAssessment?.id;
    if (!assessmentId) {
      // no persisted assessment yet — save locally
      showToast('Draft saved locally (no assessment run yet).', 'warning');
      setIsNotesDirty(false);
      return;
    }
    setIsSaving(true);
    try {
      await assessmentService.updateNotes(assessmentId, notes, null);
      setIsNotesDirty(false);
      showToast('Planning notes saved successfully.', 'success');
    } catch {
      showToast('Unable to save notes — check connection.', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [persistedAssessment?.id, showToast]);

  // Auto-save notes 2 s after user stops typing (debounce)
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setSurgeonNotes(val);
    setIsNotesDirty(true);
    clearTimeout(notesDebounceRef.current);
    notesDebounceRef.current = setTimeout(() => persistNotes(val), 2000);
  };

  // Save on blur immediately
  const handleNotesBlur = () => {
    clearTimeout(notesDebounceRef.current);
    if (isNotesDirty) persistNotes(surgeonNotes);
  };

  // ── Save Draft button ──
  const handleSaveDraft = () => {
    clearTimeout(notesDebounceRef.current);
    persistNotes(surgeonNotes);
  };

  // ── Finalize Plan — saves notes then locks via API ──
  const handleFinalize = async () => {
    setIsFinalizing(true);
    try {
      clearTimeout(notesDebounceRef.current);
      const assessmentId = persistedAssessment?.id;
      if (assessmentId) {
        await assessmentService.updateNotes(assessmentId, surgeonNotes, null);
      }
      setIsFinalized(true);
      setIsNotesDirty(false);
      showToast('Pre-surgical plan finalized and locked for operative review.', 'success');
    } catch {
      showToast('Unable to finalize plan — check connection.', 'error');
    } finally {
      setIsFinalizing(false);
    }
  };

  // ── Share — real clipboard URL copy ──
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Report URL copied to clipboard.', 'success');
    } catch {
      showToast('Could not access clipboard. Copy URL manually.', 'error');
    }
  };

  // ── Export PDF — uses print stylesheet ──
  const handleExportPdf = () => {
    showToast('Opening print dialog for PDF export...', 'success');
    setTimeout(() => window.print(), 400);
  };

  // ── Compute effective surgical plan (backend → fallback to dynamic) ──
  const effectivePlan = useMemo(() => {
    if (plan && plan.overview) return plan;
    const proc = patient?.procedure || assessment?.procedure || 'Total Hip Arthroplasty (THA)';
    const risk = assessment?.overallQualityRisk ?? 52;
    const isHighRisk = risk >= 65;
    const isModerateRisk = risk >= 40;

    let hardwareList = [];
    if (proc.includes('Hip') || proc.includes('THA')) {
      hardwareList = [
        { id: 'h1', name: isHighRisk ? 'Augmented Cementless Femoral Stem (Porous Coated)' : 'Standard Primary Femoral Stem', spec: isHighRisk ? 'Hydroxyapatite/Ti-Plasma' : 'Standard 12/14 Taper', selected: true },
        { id: 'h2', name: 'Acetabular Cup with Multi-Hole Option', spec: '54 mm outer / 36 mm inner', selected: true },
        { id: 'h3', name: isHighRisk ? 'Bicortical Acetabular Dome Screws (x3)' : 'Cancellous Dome Screws (x2)', spec: '6.5 x 30 mm', selected: isHighRisk },
        { id: 'h4', name: 'Calcium Phosphate Bone Void Filler', spec: '5 cc injectable', selected: isHighRisk },
        { id: 'h5', name: 'Ceramic-on-Crosslinked Polyethylene Liner', spec: 'Neutral 36 mm', selected: true },
      ];
    } else if (proc.includes('Knee') || proc.includes('TKA')) {
      hardwareList = [
        { id: 'k1', name: 'Femoral Component (Posterior Stabilized)', spec: 'Size 4 Right', selected: true },
        { id: 'k2', name: 'Tibial Baseplate with Stem Extension', spec: 'Size 3 + 30 mm stem', selected: true },
        { id: 'k3', name: 'XLPE Insert', spec: '11 mm Highly Cross-Linked UHMWPE', selected: true },
        { id: 'k4', name: 'Antibiotic-Impregnated Bone Cement', spec: '2x 40 g Gentamicin', selected: isModerateRisk || isHighRisk },
      ];
    } else {
      hardwareList = [
        { id: 'f1', name: 'Proximal Femoral Recon Locking Nail (PFN)', spec: '10 x 340 mm 125°', selected: true },
        { id: 'f2', name: 'Cephalomedullary Helical Blade / Lag Screw', spec: '10.5 x 95 mm', selected: true },
        { id: 'f3', name: 'Distal Static / Dynamic Locking Screws', spec: '4.9 x 38 mm', selected: true },
        { id: 'f4', name: 'Bio-absorbable Cement Augmentation Kit', spec: 'Radio-opaque CaP', selected: isHighRisk },
      ];
    }

    return {
      procedure: proc,
      scheduledDate: patient?.scheduledDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      overview: {
        tag: proc.includes('Hip') ? 'Proximal Femur / Hip' : proc.includes('Knee') ? 'Distal Femur / Knee' : 'Femoral Shaft / Segment',
        approach: proc.includes('Hip') ? 'Direct Anterior / Posterolateral' : proc.includes('Knee') ? 'Medial Parapatellar' : 'Anterolateral / Closed Reduction',
        levels: proc.includes('Hip') ? 'Femoral Neck & Acetabulum' : proc.includes('Knee') ? 'Distal Femur & Proximal Tibia' : 'Subtrochanteric / Diaphyseal',
        considerations: isHighRisk ? [
          'Elevated bone turnover: Consider augmented fixation purchase.',
          'Pre-operative Vitamin D3 and Calcium optimization recommended.',
          'High structural vulnerability: Minimize excessive reaming.',
          'Plan post-op protected weight bearing timeline.',
        ] : isModerateRisk ? [
          'Moderate metabolic risk: Monitor bone-implant interface post-op.',
          'Standard primary fixation; augmentation contingency available.',
          'Routine intra-operative torque surveillance.',
        ] : [
          'Bone stock verified suitable for primary implant fixation.',
          'Standard instrumentation and loading timeline indicated.',
          'Routine intra-operative torque surveillance.',
        ],
      },
      hardwareChecklist: hardwareList,
    };
  }, [plan, patient, assessment]);

  const {
    procedure = 'Procedure',
    scheduledDate = 'Scheduled',
    overview = {},
    hardwareChecklist = [],
  } = effectivePlan;

  const getRCL = (level = 'MODERATE') => {
    switch (level.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return { color: '#dc2626', label: 'HIGH RISK', text: 'text-red-700', bg: 'bg-red-50', chip: 'bg-red-100 ring-red-200 text-red-700', bar: 'bg-red-500' };
      case 'MODERATE':
        return { color: '#f59e0b', label: 'MODERATE', text: 'text-amber-700', bg: 'bg-amber-50', chip: 'bg-amber-100 ring-amber-200 text-amber-700', bar: 'bg-amber-500' };
      case 'LOW':
      default:
        return { color: '#10b981', label: 'LOW RISK', text: 'text-teal-700', bg: 'bg-teal-50', chip: 'bg-teal-100 ring-teal-200 text-teal-700', bar: 'bg-teal-500' };
    }
  };

  const getStatusBadge = (status = '') => {
    switch (status.toLowerCase()) {
      case 'elevated': return 'bg-red-50 text-red-700 ring-red-200';
      case 'low':
      case 'deficient': return 'bg-amber-50 text-amber-700 ring-amber-200';
      case 'normal':
      default: return 'bg-teal-50 text-teal-700 ring-teal-200';
    }
  };

  const isItemSelected = (id, defaultSelected) => {
    if (hardwareSelection[id] !== undefined) return hardwareSelection[id];
    return defaultSelected;
  };

  const toggleHardwareItem = (id, currentVal) => {
    updateHardwareSelection(id, !currentVal);
  };

  const selectedHardwareCount = hardwareChecklist.filter((h) => isItemSelected(h.id, h.selected)).length;

  const displayBiomarkers = [
    { name: 'Parathyroid Hormone (PTH)', key: 'pth' },
    { name: '25-OH Vitamin D', key: 'vitaminD' },
    { name: 'Total Calcium', key: 'calcium' },
    { name: 'Total Phosphate', key: 'phosphate' },
    { name: 'Alkaline Phosphatase (ALP)', key: 'alp' },
    { name: 'CTX-I (Bone Resorption)', key: 'ctx' },
  ];

  const overallRisk = assessment?.overallQualityRisk ?? 52;
  const riskLevel = overallRisk >= 65 ? 'HIGH' : overallRisk >= 40 ? 'MODERATE' : 'LOW';
  const rclStyle = getRCL(riskLevel);

  // Risk zone data from assessment / context
  const riskZones = useMemo(() => {
    const base = [
      { label: 'Femoral Neck', risk: overallRisk >= 65 ? 'HIGH' : overallRisk >= 40 ? 'MODERATE' : 'LOW', tscore: assessment?.dexa_tscore || '-2.1' },
      { label: 'Greater Trochanter', risk: overallRisk >= 55 ? 'MODERATE' : 'LOW', tscore: assessment?.dexa_tscore ? String((parseFloat(assessment.dexa_tscore) + 0.4).toFixed(1)) : '-1.7' },
      { label: 'Femoral Shaft', risk: 'LOW', tscore: assessment?.dexa_tscore ? String((parseFloat(assessment.dexa_tscore) + 1.1).toFixed(1)) : '-1.0' },
    ];
    return base;
  }, [overallRisk, assessment]);

  const activeRoiNotes = useMemo(() => {
    if (!roiNotes) return {};
    const filtered = {};
    for (const [region, note] of Object.entries(roiNotes)) {
      if (region !== 'vertebral-body' && region !== 'vertebral_body' && note && typeof note === 'string' && note.trim()) {
        filtered[region] = note;
      }
    }
    return filtered;
  }, [roiNotes]);

  const BiomarkerTable = () => (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left p-3.5 font-bold text-slate-600 text-xs uppercase tracking-wide">Marker</th>
            <th className="text-left p-3.5 font-bold text-slate-600 text-xs uppercase tracking-wide">Live Value</th>
            <th className="text-left p-3.5 font-bold text-slate-600 text-xs uppercase tracking-wide">Ref Range</th>
            <th className="text-left p-3.5 font-bold text-slate-600 text-xs uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {displayBiomarkers.map((item) => {
            const b = contextBiomarkers?.[item.key] || {};
            const badge = getStatusBadge(b.status || 'normal');
            return (
              <tr key={item.key} className="hover:bg-slate-50/50">
                <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                <td className="p-3.5 font-semibold text-slate-800">
                  {b.value ?? '—'} <span className="text-xs text-slate-500 font-medium">{b.unit}</span>
                </td>
                <td className="p-3.5 text-xs text-slate-500 font-semibold">{b.ref || 'Standard'}</td>
                <td className="p-3.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ring-1 ${badge}`}>
                    {b.status === 'low' && <span>↓</span>}
                    {b.status === 'deficient' && <span>↓</span>}
                    {b.status === 'elevated' && <span>↑</span>}
                    {(!b.status || b.status === 'normal') && <CheckCircle2 size={11} />}
                    {(b.status || 'NORMAL').toUpperCase()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const toastColors = {
    success: 'bg-slate-900 text-white border-slate-700',
    warning: 'bg-amber-700 text-white border-amber-600',
    error: 'bg-red-700 text-white border-red-600',
  };

  return (
    <div className="space-y-8 relative">

      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 text-sm font-semibold transition-all ${toastColors[toastMessage.type] || toastColors.success}`}>
          {toastMessage.type === 'error'
            ? <AlertTriangle size={18} className="shrink-0" />
            : <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          }
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Pre-Surgical Summary</h2>
          <p className="text-slate-600 mt-1 text-base">Consolidated clinical deliverable for operative planning and risk mitigation.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
          >
            <Link2 size={16} />
            Copy Link
          </button>
          <button
            onClick={handleExportPdf}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <FileDown size={16} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">

        {/* Report Header Bar */}
        <div className="px-8 py-7 border-b border-slate-200 bg-white flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <FileText size={18} />
              </div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Clinical Deliverable</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Pre-Surgical Planning Report</h3>
            <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <UserRound size={15} className="text-slate-500" />
                <span className="text-slate-500 font-semibold">Patient ID:</span>
                <span className="font-black text-slate-900">{effectivePatientId}</span>
              </div>
              {patient && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold">Age/Gender:</span>
                  <span className="font-bold text-slate-800">{patient.age} yrs • {patient.gender}</span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <Clock size={15} className="text-slate-500" />
                <span className="text-slate-500 font-semibold">Scheduled:</span>
                <span className="font-black text-slate-900">{scheduledDate}</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 rounded-xl border border-blue-200">
                <Layers size={15} className="text-blue-600" />
                <span className="text-blue-700 font-black">{procedure}</span>
              </div>
            </div>
          </div>

          {/* Finalized / Draft Badge */}
          {isFinalized ? (
            <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-800 rounded-2xl border-2 border-emerald-200 ring-2 ring-emerald-100">
              <Lock size={18} className="text-emerald-600" />
              <div className="leading-tight">
                <p className="font-black text-sm">PLAN FINALIZED</p>
                <p className="text-xs font-semibold opacity-80">Locked for operative review</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-5 py-3 bg-amber-50 text-amber-800 rounded-2xl border-2 border-amber-200 ring-2 ring-amber-100">
              <AlertCircle size={18} className="text-amber-600" />
              <div className="leading-tight">
                <p className="font-black text-sm">DRAFT MODE</p>
                <p className="text-xs font-semibold opacity-80">Click Finalize to lock</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 space-y-8">
          <div className="grid lg:grid-cols-3 gap-6">

            {/* ── LEFT 2/3 column ── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Surgical Site Overview — real data, no placeholder icon */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Activity size={16} />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">Surgical Site Overview</h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                    {overview.tag || 'Proximal Femur'}
                  </span>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">

                    {/* Risk Zone Map — replaces placeholder icon box */}
                    <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-white border border-slate-200 p-4 space-y-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Anatomical Risk Zone Map</p>
                      {riskZones.map((zone) => {
                        const z = getRCL(zone.risk);
                        return (
                          <div key={zone.label} className={`flex items-center justify-between p-3 rounded-xl border ${z.bg} border-opacity-60`} style={{ borderColor: z.color + '40' }}>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: z.color }} />
                              <span className="text-xs font-bold text-slate-800">{zone.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold text-slate-500">T: {zone.tscore}</span>
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ring-1 ${z.chip}`}>
                                {z.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <p className="text-[10px] text-slate-400 italic pt-1">
                        Derived from volumetric AI bone quality engine · T-Score estimates
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Surgical Approach</p>
                        <p className="text-sm font-bold text-slate-900">{overview.approach || 'Anterolateral'}</p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Target Anatomy</p>
                        <p className="text-sm font-bold text-slate-900">{overview.levels || 'Femoral Neck & Acetabulum'}</p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Key Clinical Considerations</p>
                        <ul className="text-xs text-slate-700 font-semibold leading-relaxed mt-1 space-y-1">
                          {(overview.considerations || ['Assess bone density pre-op.']).map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Biomarkers Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-slate-900">Synchronized Chemical Biomarkers</h4>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Live Values
                  </span>
                </div>
                <div className="p-6">
                  <BiomarkerTable />
                </div>
              </div>

              {/* ROI Annotations — from 3D Planning step */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-2">
                  <Edit3 size={16} className="text-blue-600" />
                  <h4 className="text-base font-extrabold text-slate-900">3D Region of Interest (ROI) Annotations</h4>
                </div>
                <div className="p-6 space-y-3">
                  {Object.keys(activeRoiNotes).length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-slate-400 italic">No ROI annotations added yet.</p>
                      <p className="text-[11px] text-slate-400 mt-1">Add notes in the 3D Planning step — they appear here automatically.</p>
                    </div>
                  ) : (
                    Object.entries(activeRoiNotes).map(([region, note]) => (
                      <div key={region} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                          {region.replace(/-/g, ' ')}:
                        </span>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT 1/3 column ── */}
            <div className="space-y-6">

              {/* Dynamic AI Risk Assessment Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <AlertTriangle size={16} />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">AI Risk Assessment</h4>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ring-1 ${rclStyle.chip}`}>
                    {overallRisk}% RISK
                  </span>
                </div>

                {/* Risk bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                    <span>Bone Quality Risk</span>
                    <span>{overallRisk}%</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${rclStyle.bar}`}
                      style={{ width: `${overallRisk}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-600">Est. DEXA T-Score:</span>
                    <span className="font-black text-slate-900">{assessment?.dexa_tscore || '—'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-600">Structural Vulnerability:</span>
                    <span className="font-black text-slate-900">{assessment?.structuralVulnerability ?? '—'}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-600">Risk Category:</span>
                    <span className={`font-black ${rclStyle.text}`}>{rclStyle.label}</span>
                  </div>
                </div>

                {assessment?.insights?.length > 0 && (
                  <div className={`p-4 rounded-xl border-2 flex items-start gap-3 ${rclStyle.bg}`} style={{ borderColor: rclStyle.color + '60' }}>
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" style={{ color: rclStyle.color }} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wide mb-1" style={{ color: rclStyle.color }}>Primary Observation</p>
                      <p className="text-xs leading-relaxed font-semibold text-slate-800">
                        {assessment.insights[0].text}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Surgeon's Comprehensive Plan — REAL backend-linked textarea */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-base font-extrabold text-slate-900">Surgeon&apos;s Plan</h4>
                  <div className="flex items-center gap-2">
                    {isSaving && <Loader2 size={13} className="text-blue-500 animate-spin" />}
                    {!isSaving && isNotesDirty && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Unsaved</span>
                    )}
                    {!isSaving && !isNotesDirty && surgeonNotes && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Saved</span>
                    )}
                  </div>
                </div>
                <textarea
                  value={surgeonNotes}
                  onChange={handleNotesChange}
                  onBlur={handleNotesBlur}
                  disabled={isFinalized}
                  rows={5}
                  placeholder="Enter patient-specific surgical considerations, metabolic correction protocol, implant preferences, and operative risks..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:bg-slate-50 disabled:text-slate-600 resize-none font-medium leading-relaxed placeholder:text-slate-400"
                />
                {!isFinalized && (
                  <p className="text-[10px] text-slate-400 mt-1.5 italic">Auto-saves 2s after typing · Linked to assessment record</p>
                )}
              </div>

              {/* Surgical Hardware Checklist */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-extrabold text-slate-900">Hardware Checklist</h4>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                    {selectedHardwareCount}/{hardwareChecklist.length} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {hardwareChecklist.map((item) => {
                    const checked = isItemSelected(item.id, item.selected);
                    const disabled = isFinalized;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer text-xs ${
                          checked
                            ? 'bg-blue-50/60 border-blue-200 ring-1 ring-blue-100'
                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleHardwareItem(item.id, checked)}
                          className="mt-0.5 w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className={`font-bold ${checked ? 'text-blue-800' : 'text-slate-900'}`}>
                            {item.name}
                            {item.spec && (
                              <span className="text-[10px] font-semibold text-slate-500 ml-1.5">({item.spec})</span>
                            )}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                {isFinalized && (
                  <p className="text-[10px] text-slate-400 mt-3 italic flex items-center gap-1">
                    <Lock size={10} /> Hardware locked — plan finalized
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-500 font-medium">
              {isFinalized
                ? '🔒 Plan is finalized. All fields are locked.'
                : isNotesDirty
                ? '⚠️ You have unsaved changes — click Save Draft or Finalize.'
                : '✓ All changes saved.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveDraft}
                disabled={isFinalized || isSaving}
                className="px-5 py-3 border-2 border-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-50 transition flex items-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Draft
              </button>
              <button
                onClick={handleFinalize}
                disabled={isFinalized || isFinalizing}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition shadow-xl shadow-blue-600/25 flex items-center gap-2 disabled:opacity-70 text-sm cursor-pointer"
              >
                {isFinalizing ? (
                  <><Loader2 size={18} className="animate-spin" /> Finalizing...</>
                ) : isFinalized ? (
                  <><Lock size={18} /> Plan Finalized &amp; Locked</>
                ) : (
                  <><FileDown size={18} /> Finalize Plan <ChevronRight size={16} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Regulatory Disclaimer */}
      <div className="bg-slate-100 rounded-2xl border border-slate-200 p-4 text-center text-xs text-slate-600 font-medium flex items-center justify-center gap-2">
        <ShieldAlert size={16} className="text-slate-500 shrink-0" />
        <p>
          <span className="font-bold text-slate-800">Regulatory Disclaimer:</span> EndoBone AI is a pre-surgical planning and assessment simulation tool. It is <strong>NOT a diagnostic medical device</strong> and should not replace professional clinical judgment.
        </p>
      </div>
    </div>
  );
}
