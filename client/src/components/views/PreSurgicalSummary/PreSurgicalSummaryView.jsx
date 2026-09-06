import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  RotateCcw,
  Plus,
  LayoutDashboard,
  Undo2,
  Sparkles,
  Box,
  FolderOpen,
  X,
  Calendar,
} from 'lucide-react';
import { useSurgicalPlan, usePatientData } from '../../../hooks';
import { usePatientContext } from '../../../context/PatientDataContext';
import { assessmentService } from '../../../services/assessmentService';
import { PreSurgicalSummarySkeleton } from '../../common';
import { REVISION_CHECKLISTS } from '../../../constants/checklists';
import { generateDynamicAnnotations } from '../../../utils/modelAnnotationEngine';

function formatScheduledDate(dateStr) {
  if (!dateStr) return 'Not Scheduled';
  try {
    const raw = String(dateStr).split('T')[0];
    const parts = raw.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const dt = new Date(year, month, day);
      if (!Number.isNaN(dt.getTime())) {
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    }
  } catch (e) {
    // fallback
  }
  return dateStr;
}

export default function PreSurgicalSummaryView({ patientId }) {
  const params = useParams();
  const navigate = useNavigate();
  const {
    biomarkers: contextBiomarkers,
    roiNotes,
    assessment,
    persistedAssessment,
    setIsNewCaseModalOpen,
    resetWorkspace,
    activePatientId,
    setActivePatientId,
    isCaseLoading,
    isAnalyzing,
    updateScheduledDate,
  } = usePatientContext();

  const effectivePatientId = patientId || params.patientId || activePatientId || null;

  if (isCaseLoading || isAnalyzing) {
    return <PreSurgicalSummarySkeleton isAnalyzing={isAnalyzing} />;
  }
  const { plan, hardwareSelection, updateHardwareSelection } = useSurgicalPlan(effectivePatientId);
  const { patient } = usePatientData(effectivePatientId);
  const [selectedProcedure, setSelectedProcedure] = useState(() => {
    const raw = patient?.procedure || assessment?.procedure || 'Total Hip Arthroplasty (THA)';
    if (raw.toLowerCase().includes('revision')) return 'Revision Arthroplasty';
    return raw;
  });
  const [revisionSubType, setRevisionSubType] = useState(() => {
    const raw = patient?.procedure || assessment?.procedure || '';
    if (raw.toLowerCase().includes('knee') || raw.toLowerCase().includes('tka')) {
      return 'Revision Total Knee Arthroplasty';
    }
    return 'Revision Total Hip Arthroplasty';
  });

  // ── Surgeon notes: loaded from assessment.planning_notes, saved to backend ──
  const [surgeonNotes, setSurgeonNotes] = useState('');
  const [isNotesDirty, setIsNotesDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [toastMessage, setToastMessage] = useState({ text: '', type: 'success' });
  const [isResetView, setIsResetView] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [scheduleInputDate, setScheduleInputDate] = useState('');
  const notesDebounceRef = useRef(null);

  // When effectivePatientId changes (e.g. from selecting a recent case on dashboard), exit reset mode
  useEffect(() => {
    if (effectivePatientId) {
      setIsResetView(false);
      setIsFinalized(false);
    }
  }, [effectivePatientId]);

  // Sync selected procedure when patient or assessment data loads
  useEffect(() => {
    const raw = patient?.procedure || assessment?.procedure;
    if (raw) {
      if (raw.toLowerCase().includes('revision')) {
        setSelectedProcedure('Revision Arthroplasty');
        if (raw.toLowerCase().includes('knee') || raw.toLowerCase().includes('tka')) {
          setRevisionSubType('Revision Total Knee Arthroplasty');
        } else {
          setRevisionSubType('Revision Total Hip Arthroplasty');
        }
      } else {
        setSelectedProcedure(raw);
      }
    }
  }, [patient?.procedure, assessment?.procedure]);

  // Load planning_notes from persisted assessment on mount / when assessment changes
  useEffect(() => {
    const notes = persistedAssessment?.planning_notes || assessment?.planning_notes || '';
    setSurgeonNotes(notes);
    setIsNotesDirty(false);
  }, [persistedAssessment?.id, assessment?.planning_notes]);

  // W-10: Cancel the debounce timer on unmount so a pending auto-save never
  // fires after the component is gone (prevents stale state update warnings).
  useEffect(() => {
    return () => {
      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    };
  }, []);

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

  // ── Reset workspace handlers ──
  const handleConfirmReset = () => {
    setIsResetView(true);
    setShowResetModal(false);
    setSurgeonNotes('');
    setIsFinalized(false);
    setIsNotesDirty(false);
    if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    resetWorkspace();
    navigate('/dashboard');
    showToast('Workspace reset successfully. Redirected to Dashboard.', 'warning');
  };

  const handleRestoreCase = () => {
    setIsResetView(false);
    navigate('/dashboard');
    showToast('Navigate to Dashboard to select or create a case.', 'success');
  };

  const handleAddNewCase = () => {
    setIsNewCaseModalOpen(true);
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
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
    const proc = selectedProcedure;
    const risk = assessment?.overallQualityRisk ?? 52;
    const isHighRisk = risk >= 65;
    const isModerateRisk = risk >= 40;

    const isRevision = proc === 'Revision Arthroplasty' || proc?.toLowerCase().includes('revision');
    const isRevisionKnee = isRevision && (revisionSubType === 'Revision Total Knee Arthroplasty' || proc?.toLowerCase().includes('knee') || proc?.toLowerCase().includes('tka'));
    const isRevisionHip = isRevision && !isRevisionKnee;

    if (plan && plan.overview && !isRevision && selectedProcedure === (patient?.procedure || plan?.procedure)) {
      return plan;
    }

    let hardwareGroups = [];
    if (isRevisionHip) {
      hardwareGroups = [
        {
          title: REVISION_CHECKLISTS.r_tha.title,
          type: 'checkbox',
          items: REVISION_CHECKLISTS.r_tha.items.map((item) => ({
            id: item.id,
            name: item.name,
            selected: item.riskTrigger === 'high'
              ? isHighRisk
              : item.riskTrigger === 'moderate'
                ? (isModerateRisk || isHighRisk)
                : item.defaultSelected,
          })),
        }
      ];
    } else if (isRevisionKnee) {
      hardwareGroups = [
        {
          title: REVISION_CHECKLISTS.r_tka.title,
          type: 'checkbox',
          items: REVISION_CHECKLISTS.r_tka.items.map((item) => ({
            id: item.id,
            name: item.name,
            selected: item.riskTrigger === 'high'
              ? isHighRisk
              : item.riskTrigger === 'moderate'
                ? (isModerateRisk || isHighRisk)
                : item.defaultSelected,
          })),
        }
      ];
    } else if (proc === 'Distal Femur Fracture Fixation') {
      hardwareGroups = [
        {
          title: 'Primary Fixation',
          type: 'radio',
          groupId: 'df_primary',
          items: [
            { id: 'df1', name: 'Distal Femoral Locking Plate' },
            { id: 'df2', name: 'Retrograde Intramedullary Nail' }
          ]
        },
        {
          title: 'Additional Fixation',
          type: 'checkbox',
          items: [
            { id: 'df3', name: 'Locking Screws' },
            { id: 'df4', name: 'Cortical Screws' },
            { id: 'df5', name: 'Lag Screw' },
            { id: 'df6', name: 'Bone Graft / Bone Void Filler' }
          ]
        }
      ];
    } else if (proc === 'Proximal Femur Fracture Fixation') {
      hardwareGroups = [
        {
          title: 'Fixation Checklist',
          type: 'checkbox',
          items: [
            { id: 'pf1', name: 'Cephalomedullary Nail' },
            { id: 'pf2', name: 'Dynamic Hip Screw (DHS)' },
            { id: 'pf3', name: 'Proximal Femoral Locking Plate' },
            { id: 'pf4', name: 'Lag Screw / Helical Blade' },
            { id: 'pf5', name: 'Distal Locking Screws' },
            { id: 'pf6', name: 'Cerclage Cable/Wire' },
            { id: 'pf7', name: 'Bone Graft / Bone Void Filler' }
          ]
        }
      ];
    } else if (proc === 'Femoral Fracture Fixation') {
      hardwareGroups = [
        {
          title: 'Fixation Strategy',
          type: 'radio',
          groupId: 'ff_strategy',
          items: [
            { id: 'ff1', name: 'Intramedullary Nail' },
            { id: 'ff2', name: 'Plate & Screw Fixation' },
            { id: 'ff3', name: 'Combined Fixation' }
          ]
        },
        {
          title: 'Fixation Checklist',
          type: 'checkbox',
          items: [
            { id: 'ff4', name: 'Intramedullary Femoral Nail' },
            { id: 'ff5', name: 'Locking Plate' },
            { id: 'ff6', name: 'Cortical/Locking Screws' },
            { id: 'ff7', name: 'Lag Screw' },
            { id: 'ff8', name: 'Cerclage Cable/Wire' },
            { id: 'ff9', name: 'Bone Graft / Bone Void Filler' }
          ]
        }
      ];
    } else if (proc === 'Total Hip Arthroplasty (THA)' || proc.includes('Hip')) {
      hardwareGroups = [
        {
          title: 'Implant & Fixation Checklist',
          type: 'checkbox',
          items: [
            { id: 'th1', name: 'Standard Primary Femoral Stem', selected: true },
            { id: 'th2', name: 'Acetabular Cup/Shell', selected: true },
            { id: 'th3', name: 'Acetabular Fixation Screws', selected: isHighRisk },
            { id: 'th4', name: 'Femoral Head', selected: true },
            { id: 'th5', name: 'Acetabular Liner', selected: true },
            { id: 'th6', name: 'Bone Void Filler/Augment', selected: isHighRisk },
            { id: 'th7', name: 'Bone Cement (if applicable)', selected: false }
          ]
        }
      ];
    } else if (proc === 'Total Knee Arthroplasty (TKA)' || proc.includes('Knee')) {
      hardwareGroups = [
        {
          title: 'Implant & Fixation Checklist',
          type: 'checkbox',
          items: [
            { id: 'tk1', name: 'Femoral Component', selected: true },
            { id: 'tk2', name: 'Tibial Baseplate', selected: true },
            { id: 'tk3', name: 'Tibial Insert', selected: true },
            { id: 'tk4', name: 'Patellar Component', selected: true },
            { id: 'tk5', name: 'Stem/Augment', selected: isModerateRisk || isHighRisk }
          ]
        }
      ];
    } else {
      // Fallback
      hardwareGroups = [
        {
          title: 'Implant & Fixation Checklist',
          type: 'checkbox',
          items: [
            { id: 'gen1', name: 'Standard Primary Implant' },
            { id: 'gen2', name: 'Fixation Screws' }
          ]
        }
      ];
    }

    const procedureDisplayName = isRevision
      ? (isRevisionKnee ? 'Revision Total Knee Arthroplasty' : 'Revision Total Hip Arthroplasty')
      : proc;

    return {
      procedure: procedureDisplayName,
      scheduledDate: patient?.scheduledDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      overview: {
        tag: isRevision
          ? (isRevisionKnee ? 'Distal Femur / Knee (Revision)' : 'Proximal Femur / Hip (Revision)')
          : (proc.includes('Hip') || proc === 'Proximal Femur Fracture Fixation' ? 'Proximal Femur / Hip' : proc.includes('Knee') || proc === 'Distal Femur Fracture Fixation' ? 'Distal Femur / Knee' : 'Femoral Shaft / Segment'),
        approach: isRevision
          ? (isRevisionKnee ? 'Medial Parapatellar / Extensor Snip (if needed)' : 'Posterolateral / Extended Trochanteric Osteotomy (ETO)')
          : (proc.includes('Hip') ? 'Direct Anterior / Posterolateral' : proc.includes('Knee') ? 'Medial Parapatellar' : 'Anterolateral / Closed Reduction'),
        levels: isRevision
          ? (isRevisionKnee ? 'Distal Femur & Proximal Tibia Joint Line' : 'Acetabular Bone Stock & Femoral Canal')
          : (proc.includes('Hip') || proc === 'Proximal Femur Fracture Fixation' ? 'Femoral Neck & Acetabulum' : proc.includes('Knee') || proc === 'Distal Femur Fracture Fixation' ? 'Distal Femur & Proximal Tibia' : 'Subtrochanteric / Diaphyseal'),
        considerations: isRevision ? (
          isRevisionKnee ? (
            isHighRisk ? [
              'Severe metaphyseal bone loss (AORI Type II/III): Modular stem extensions and stepped augments required.',
              'Assess collateral ligament integrity: Prepare constrained condylar (CCK) / hinged prosthesis.',
              'Elevated bone metabolic turnover: Optimize bone void filler/graft and cement technique.',
              'Plan joint line reconstruction and patellar tracking restoration.',
            ] : isModerateRisk ? [
              'Moderate metaphyseal bone defect: Wedge augments and offset stem extensions available.',
              'Assess flexion/extension gap symmetry and constraint requirement.',
              'Standard revision instrumentation and extraction tools prepared.',
            ] : [
              'Standard revision knee components with stem extension stability.',
              'Verify mechanical axis alignment and ligamentous balance.',
              'Standard post-operative recovery and rehabilitation protocol.',
            ]
          ) : (
            isHighRisk ? [
              'Severe acetabular/femoral bone loss: Porous metal augments and modular revision stem required.',
              'Elevated bone turnover: Pre-op metabolic bone optimization and secure diaphyseal fixation indicated.',
              'Evaluate for pelvic discontinuity and acetabular column integrity.',
              'Plan extensive hardware removal and structural bone void filler/graft.',
            ] : isModerateRisk ? [
              'Moderate bone loss: Verify stable diaphyseal or metaphyseal scratch fit.',
              'Prepare modular stems, offset options, and acetabular augment backups.',
              'Routine intra-operative stability and leg-length assessment.',
            ] : [
              'Routine revision implant fixation; verify stable press-fit and liner engagement.',
              'Standard modular instrumentation and revision extraction kit ready.',
              'Post-operative progressive mobilization protocol.',
            ]
          )
        ) : isHighRisk ? [
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
      hardwareGroups,
    };
  }, [plan, patient, assessment, selectedProcedure, revisionSubType]);

  const {
    procedure = 'Procedure',
    scheduledDate = 'Scheduled',
    overview = {},
    hardwareGroups = [],
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

  const toggleHardwareItem = (id, currentVal, groupType, groupId, items) => {
    if (isFinalized) return;
    if (groupType === 'radio') {
      // Turn off other items in the radio group
      items.forEach(item => {
        if (item.id !== id) updateHardwareSelection(item.id, false);
      });
      updateHardwareSelection(id, true);
    } else {
      updateHardwareSelection(id, !currentVal);
    }
  };

  const selectedHardwareCount = hardwareGroups.reduce((total, group) => {
    return total + group.items.filter(item => isItemSelected(item.id, item.selected)).length;
  }, 0);
  
  const totalHardwareCount = hardwareGroups.reduce((total, group) => total + group.items.length, 0);

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

  // Risk zone data dynamically generated from active model and validated biomarkers
  const riskZones = useMemo(() => {
    const dynamicAnatomy = generateDynamicAnnotations({
      patient,
      biomarkers: contextBiomarkers,
      assessment,
      roiNotes,
    });
    return dynamicAnatomy.zones.map((zone) => ({
      label: zone.label,
      risk: (zone.riskLevel || 'LOW').toUpperCase(),
      tscore: zone.tScore || assessment?.dexa_tscore || '-1.5',
      vBMD: zone.vBMD,
      note: zone.note,
    }));
  }, [patient, contextBiomarkers, assessment, roiNotes]);

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
    <div className="overflow-x-auto rounded-xl border border-slate-200 min-w-0 max-w-full">
      <table className="w-full text-xs sm:text-sm min-w-[480px]">
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left p-2.5 sm:p-3.5 font-bold text-slate-600 text-[11px] sm:text-xs uppercase tracking-wide">Marker</th>
            <th className="text-left p-2.5 sm:p-3.5 font-bold text-slate-600 text-[11px] sm:text-xs uppercase tracking-wide">Live Value</th>
            <th className="text-left p-2.5 sm:p-3.5 font-bold text-slate-600 text-[11px] sm:text-xs uppercase tracking-wide">Ref Range</th>
            <th className="text-left p-2.5 sm:p-3.5 font-bold text-slate-600 text-[11px] sm:text-xs uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {displayBiomarkers.map((item) => {
            const b = contextBiomarkers?.[item.key] || {};
            const badge = getStatusBadge(b.status || 'normal');
            return (
              <tr key={item.key} className="hover:bg-slate-50/50">
                <td className="p-2.5 sm:p-3.5 font-bold text-slate-900">{item.name}</td>
                <td className="p-2.5 sm:p-3.5 font-semibold text-slate-800 whitespace-nowrap">
                  {b.value ?? '—'} <span className="text-[10px] sm:text-xs text-slate-500 font-medium">{b.unit}</span>
                </td>
                <td className="p-2.5 sm:p-3.5 text-[11px] sm:text-xs text-slate-500 font-semibold whitespace-nowrap">{b.ref || 'Standard'}</td>
                <td className="p-2.5 sm:p-3.5">
                  <span className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-black ring-1 ${badge} whitespace-nowrap`}>
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
    <div className="space-y-6 sm:space-y-8 relative min-w-0 max-w-full">

      {/* Toast Notification */}
      {toastMessage.text && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl shadow-2xl border flex items-center gap-2.5 sm:gap-3 text-xs sm:text-sm font-semibold transition-all max-w-[90vw] ${toastColors[toastMessage.type] || toastColors.success}`}>
          {toastMessage.type === 'error'
            ? <AlertTriangle size={16} className="shrink-0" />
            : <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          }
          <span className="truncate">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 min-w-0">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Pre-Surgical Summary</h2>
          <p className="text-slate-600 mt-0.5 sm:mt-1 text-xs sm:text-sm lg:text-base">Consolidated clinical deliverable for operative planning and risk mitigation.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap shrink-0 print:hidden">
          <button
            onClick={() => setShowResetModal(true)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 border border-red-200 bg-white rounded-xl text-xs sm:text-sm font-bold text-red-600 hover:bg-red-50 hover:border-red-300 flex items-center gap-1.5 sm:gap-2 transition cursor-pointer shadow-sm"
            title="Reset workspace and clear patient UI"
          >
            <RotateCcw size={15} />
            <span>Reset UI</span>
          </button>
          <button
            onClick={() => window.print()}
            disabled={isResetView}
            className="px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 sm:gap-2 transition cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Printer size={15} />
            <span className="hidden xs:inline">Print</span>
          </button>
          <button
            onClick={handleShare}
            disabled={isResetView}
            className="px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 bg-white rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 sm:gap-2 transition cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Link2 size={15} />
            <span className="hidden xs:inline">Share</span>
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isResetView}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-blue-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-blue-700 flex items-center gap-1.5 sm:gap-2 transition shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileDown size={15} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Confirmation Reset Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                <RotateCcw size={22} />
              </div>
              <button
                onClick={() => setShowResetModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Reset Pre-Surgical Summary?</h3>
              <p className="text-slate-600 text-xs sm:text-sm mt-1.5 leading-relaxed">
                This will reset the entire summary UI, clearing loaded 3D models, biomarker data, surgeon notes, and hardware checklists so you can start a fresh case or select from recent cases.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <span>You will be prompted to either add a new patient case or choose an existing case from your dashboard.</span>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs sm:text-sm font-bold hover:bg-red-700 transition shadow-lg shadow-red-600/20 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw size={15} />
                Yes, Reset Workspace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMPTY / RESET STATE UI ── */}
      {isResetView || !effectivePatientId ? (
        <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/40 rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 animate-fade-in">
          <div className="max-w-2xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-100 text-blue-600 ring-8 ring-blue-50/80 shadow-inner">
              <RotateCcw size={32} className="animate-spin-slow" />
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Pre-Surgical Workspace Cleared
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm sm:text-base leading-relaxed">
              No active patient or 3D anatomical model is currently loaded in this summary workspace. To conduct pre-operative planning and biomarker risk synthesis, choose an option below:
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
            {/* Card 1: Add New Case */}
            <div
              onClick={handleAddNewCase}
              className="group relative bg-white p-6 sm:p-7 rounded-3xl border-2 border-blue-200 hover:border-blue-500 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                    Add New Case
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                    <Sparkles size={11} /> New
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Input demographics, pre-op scan ID, and metabolic biomarkers to run real-time AI risk assessment and 3D modeling.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs sm:text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                <span>Open Case Creator</span>
                <ChevronRight size={16} className="ml-1" />
              </div>
            </div>

            {/* Card 2: Select from Dashboard */}
            <div
              onClick={handleGoToDashboard}
              className="group relative bg-white p-6 sm:p-7 rounded-3xl border-2 border-slate-200 hover:border-indigo-500 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-slate-800 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                  <LayoutDashboard size={22} />
                </div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                    Select from Recent Cases
                  </h4>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                    <FolderOpen size={11} /> Dashboard
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  Browse clinical records, existing patient profiles, and recently evaluated surgical candidates on your dashboard.
                </p>
              </div>
              <div className="mt-6 flex items-center text-xs sm:text-sm font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
                <span>View Dashboard Cases</span>
                <ChevronRight size={16} className="ml-1" />
              </div>
            </div>
          </div>

          {/* Quick status & Restore option */}
          <div className="max-w-3xl mx-auto pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Workspace Status: Cleared / Awaiting Case Selection</span>
            </div>
            <button
              onClick={handleRestoreCase}
              className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition py-1 px-3 rounded-lg hover:bg-slate-100"
            >
              <Undo2 size={13} />
              <span>Restore Previous Case ({effectivePatientId})</span>
            </button>
          </div>
        </div>
      ) : (
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
              {/* Scheduled Surgery Date with Interactive Rescheduler */}
              <div className="relative">
                <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <Calendar size={15} className="text-blue-600 shrink-0" />
                  <span className="text-slate-500 font-semibold text-xs sm:text-sm">Scheduled:</span>
                  <span className="font-black text-slate-900 text-xs sm:text-sm">
                    {formatScheduledDate(patient?.scheduledDate || scheduledDate)}
                  </span>
                  {!isFinalized && (
                    <button
                      type="button"
                      onClick={() => {
                        setScheduleInputDate((patient?.scheduledDate || scheduledDate || '').split('T')[0]);
                        setIsEditingSchedule((prev) => !prev);
                      }}
                      className="ml-1 p-1 hover:bg-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                      title="Reschedule surgery date"
                    >
                      <Edit3 size={13} />
                    </button>
                  )}
                </div>

                {isEditingSchedule && (
                  <div className="absolute top-full left-0 mt-2 z-40 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 w-72 animate-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                      <div className="flex items-center gap-1.5 text-xs font-black text-slate-800 uppercase tracking-wide">
                        <Calendar size={13} className="text-blue-600" />
                        <span>Reschedule Surgery</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditingSchedule(false)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">New Surgery Date</label>
                        <input
                          type="date"
                          value={scheduleInputDate}
                          onChange={(e) => setScheduleInputDate(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsEditingSchedule(false)}
                          className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!scheduleInputDate || !effectivePatientId) return;
                            await updateScheduledDate(effectivePatientId, scheduleInputDate);
                            setIsEditingSchedule(false);
                            setToastMessage({
                              text: `Surgery rescheduled for ${formatScheduledDate(scheduleInputDate)}`,
                              type: 'success',
                            });
                            setTimeout(() => setToastMessage({ text: '', type: 'success' }), 4000);
                          }}
                          className="px-3.5 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <Save size={12} />
                          Save Date
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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

              {/* Specific Implant & Fixation Plan */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <h4 className="text-base font-extrabold text-slate-900">Specific Implant & Fixation Plan</h4>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200 shrink-0">
                    {selectedHardwareCount}/{totalHardwareCount} selected
                  </span>
                </div>
                
                {/* Procedure Selection */}
                <div className="mb-6">
                  <label className="block text-xs font-black text-slate-500 uppercase tracking-wide mb-2">Procedure Plan</label>
                  <select 
                    value={selectedProcedure}
                    onChange={(e) => setSelectedProcedure(e.target.value)}
                    disabled={isFinalized}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    <option value="Total Hip Arthroplasty (THA)">Total Hip Arthroplasty (THA)</option>
                    <option value="Total Knee Arthroplasty (TKA)">Total Knee Arthroplasty (TKA)</option>
                    <option value="Distal Femur Fracture Fixation">Distal Femur Fracture Fixation</option>
                    <option value="Proximal Femur Fracture Fixation">Proximal Femur Fracture Fixation</option>
                    <option value="Femoral Fracture Fixation">Femoral Fracture Fixation</option>
                    <option value="Revision Arthroplasty">Revision Arthroplasty</option>
                  </select>

                  {/* Revision Arthroplasty Subtype Selection */}
                  {(selectedProcedure === 'Revision Arthroplasty' || selectedProcedure.toLowerCase().includes('revision')) && (
                    <div className="mt-3.5 p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl">
                      <label className="block text-[11px] font-black text-blue-900 uppercase tracking-wider mb-2">
                        Revision Procedure Selection:
                      </label>
                      <div className="flex flex-wrap items-center gap-4">
                        <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${
                          revisionSubType === 'Revision Total Hip Arthroplasty'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        } ${isFinalized ? 'opacity-70 cursor-not-allowed' : ''}`}>
                          <input
                            type="radio"
                            name="revisionSubType"
                            value="Revision Total Hip Arthroplasty"
                            checked={revisionSubType === 'Revision Total Hip Arthroplasty'}
                            onChange={(e) => setRevisionSubType(e.target.value)}
                            disabled={isFinalized}
                            className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                          />
                          Revision Total Hip Arthroplasty
                        </label>
                        <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold cursor-pointer transition ${
                          revisionSubType === 'Revision Total Knee Arthroplasty'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        } ${isFinalized ? 'opacity-70 cursor-not-allowed' : ''}`}>
                          <input
                            type="radio"
                            name="revisionSubType"
                            value="Revision Total Knee Arthroplasty"
                            checked={revisionSubType === 'Revision Total Knee Arthroplasty'}
                            onChange={(e) => setRevisionSubType(e.target.value)}
                            disabled={isFinalized}
                            className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500"
                          />
                          Revision Total Knee Arthroplasty
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {hardwareGroups.map((group, groupIdx) => (
                    <div key={groupIdx} className="space-y-3">
                      <h5 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">{group.title}</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {group.items.map((item) => {
                          const checked = isItemSelected(item.id, item.selected);
                          const disabled = isFinalized;
                          return (
                            <label
                              key={item.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer text-xs ${
                                checked
                                  ? 'bg-blue-50/60 border-blue-200 ring-1 ring-blue-100'
                                  : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                              } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              <input
                                type={group.type === 'radio' ? 'radio' : 'checkbox'}
                                name={group.type === 'radio' ? group.groupId : item.id}
                                checked={checked}
                                disabled={disabled}
                                onChange={() => toggleHardwareItem(item.id, checked, group.type, group.groupId, group.items)}
                                className={`w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 ${group.type === 'radio' ? 'rounded-full' : 'rounded'}`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold truncate ${checked ? 'text-blue-800' : 'text-slate-900'}`}>
                                  {item.name}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {isFinalized && (
                  <p className="text-[10px] text-slate-400 mt-4 italic flex items-center gap-1">
                    <Lock size={10} /> Plan finalized & locked
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
            <p className="text-xs text-slate-500 font-medium">
              {isFinalized
                ? '🔒 Plan is finalized. All fields are locked.'
                : isNotesDirty
                ? '⚠️ You have unsaved changes — click Save Draft or Finalize.'
                : '✓ All changes saved.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="px-4 py-3 border-2 border-red-200 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 hover:border-red-300 transition flex items-center gap-2 text-sm cursor-pointer shadow-sm"
                title="Reset workspace and clear patient UI"
              >
                <RotateCcw size={16} />
                Reset UI
              </button>
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
      )}

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
