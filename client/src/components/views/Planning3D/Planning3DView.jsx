import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Maximize2, Minimize2, Play, Pause, Bone, FlaskConical,
  ArrowUpRight, Brain, AlertTriangle, CheckCircle,
  MapPin, TrendingDown, FileText, Crosshair, Info,
  LineChart, Tag, Compass, Box, Plus, Sparkles, LayoutDashboard, ChevronRight, FolderOpen
} from 'lucide-react';
import { usePatientContext } from '../../../context/PatientDataContext';
import { EndocrineTrendChart, Planning3DSkeleton } from '../../common';
import BoneModelViewer from './BoneModelViewer';

const BIOMARKER_INPUTS = [
  { key: 'pth', fullLabel: 'Parathyroid Hormone', unit: 'pg/mL', ref: '15–65', step: 1 },
  { key: 'vitaminD', fullLabel: '25-OH Vitamin D', unit: 'ng/mL', ref: '30–100', step: 1 },
  { key: 'calcium', fullLabel: 'Total Calcium', unit: 'mg/dL', ref: '8.6–10.3', step: 0.1 },
  { key: 'phosphate', fullLabel: 'Total Phosphate', unit: 'mg/dL', ref: '2.5–4.5', step: 0.1 },
  { key: 'alp', fullLabel: 'Alkaline Phosphatase', unit: 'U/L', ref: '44–147', step: 1 },
  { key: 'ctx', fullLabel: 'Bone Resorption', unit: 'pg/mL', ref: '< 300', step: 10 },
];

const RISK_CFG = {
  high: { label: 'HIGH RISK', dot: 'bg-red-500', accent: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700 border-red-200', bar: 'bg-red-500', icon: AlertTriangle },
  moderate: { label: 'MODERATE', dot: 'bg-orange-500', accent: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700 border-orange-200', bar: 'bg-orange-500', icon: TrendingDown },
  low: { label: 'NORMAL', dot: 'bg-teal-500', accent: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-700 border-teal-200', bar: 'bg-teal-500', icon: CheckCircle },
};

const STATIC_ZONES = [
  { id: 'femoral-neck', label: 'Femoral Neck', subLabel: 'Collum Femoris', riskLevel: 'high', tScore: '-2.3', vBMD: '112.4', note: 'Critical mechanical stress and osteopenic trabecular resorption. High shear fracture risk during THA implant seating.' },
  { id: 'femoral-head', label: 'Femoral Head', subLabel: 'Caput Femoris', riskLevel: 'moderate', tScore: '-2.1', vBMD: '134.2', note: 'Articular subchondral trabeculae with focal micro-damage and thinning under weight-bearing loads.' },
  { id: 'greater-trochanter', label: 'Greater Trochanter', subLabel: 'Trochanter Major', riskLevel: 'moderate', tScore: '-1.9', vBMD: '198.6', note: 'Abductor insertion site. Cortical rarefaction creates avulsion risk during hip dislocation.' },
  { id: 'intertrochanteric', label: 'Intertrochanteric Line', subLabel: 'Crista Intertrochanterica', riskLevel: 'moderate', tScore: '-1.8', vBMD: '210.0', note: 'Metaphyseal transition zone susceptible to comminution under broaching insertion torque.' },
  { id: 'lesser-trochanter', label: 'Lesser Trochanter', subLabel: 'Trochanter Minor', riskLevel: 'moderate', tScore: '-1.7', vBMD: '220.5', note: 'Psoas tendon insertion. Calcar preservation crucial for primary stem stability.' },
  { id: 'shaft', label: 'Femoral Shaft', subLabel: 'Diaphysis / Corpus', riskLevel: 'low', tScore: '-0.5', vBMD: '845.1', note: 'Dense circumferential cortical bone (3.8mm). Structurally optimal zone for distal stem press-fit anchorage.' },
  { id: 'distal-condyles', label: 'Distal Metaphysis', subLabel: 'Condylus Medialis/Lateralis', riskLevel: 'low', tScore: '-0.8', vBMD: '650.0', note: 'Distal load-bearing condylar base with preserved cancellous architecture.' },
];

function ZoneInspectionPanel({ zone }) {
  if (!zone) return null;
  const cfg = RISK_CFG[zone.riskLevel] || RISK_CFG.low;
  const Icon = cfg.icon;
  const riskPct = zone.riskLevel === 'high' ? 87 : zone.riskLevel === 'moderate' ? 52 : 12;

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden min-w-0 max-w-full shadow-sm animate-fade-in`}>
      {/* Header */}
      <div className="px-4 py-2.5 flex items-center justify-between bg-white/70 border-b border-slate-100 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin size={13} className={`${cfg.accent} shrink-0`} />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">Active Zone</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${cfg.badge} flex items-center gap-1 shrink-0`}>
          <Icon size={9} />
          {cfg.label}
        </span>
      </div>

      <div className="p-4 space-y-3 min-w-0">
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-900 truncate">{zone.label}</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">{zone.subLabel || 'Anatomical Landmark'} • BMD Analysis</p>
        </div>

        {/* T-Score & vBMD row */}
        <div className="grid grid-cols-2 gap-2 min-w-0">
          <div className="bg-white/80 rounded-xl p-2.5 border border-white/80 text-center min-w-0">
            <div className={`text-base font-black font-mono leading-none ${cfg.accent}`}>{zone.tScore}</div>
            <div className="text-[10px] text-slate-500 font-bold mt-0.5">T-Score</div>
          </div>
          <div className="bg-white/80 rounded-xl p-2.5 border border-white/80 text-center min-w-0">
            <div className="text-base font-black font-mono leading-none text-slate-800">{zone.vBMD}</div>
            <div className="text-[10px] text-slate-500 font-bold mt-0.5">vBMD mg/cm³</div>
          </div>
        </div>

        {/* Risk level bar */}
        <div className="min-w-0">
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
            <span>Fracture Risk Index</span>
            <span className={cfg.accent}>{riskPct}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`} style={{ width: `${riskPct}%` }} />
          </div>
        </div>

        {/* Clinical observation */}
        <div className="bg-white/70 rounded-xl p-3 border border-slate-100 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Info size={11} className="text-slate-400 shrink-0" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinical Context</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium line-clamp-3">{zone.note}</p>
        </div>
      </div>
    </div>
  );
}

export default function Planning3DView({ patientId }) {
  const params = useParams();
  const navigate = useNavigate();
  const {
    biomarkers,
    selectedRegion, setSelectedRegion,
    roiNotes, updateRoiNote, persistRoiNote,
    regionalData, backendRiskLevel,
    patients,
    activePatientId,
    isCaseLoading,
    setIsNewCaseModalOpen,
  } = usePatientContext();

  const effectivePatientId = patientId || params.patientId || activePatientId || null;

  const [renderMode, setRenderMode] = useState('heatmap');
  const [viewAngle, setViewAngle] = useState('overview');
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [sidebarTab, setSidebarTab] = useState('curves');
  const [hoveredZone, setHoveredZone] = useState(null);

  const currentPatient = useMemo(() => {
    if (!effectivePatientId) return null;
    return patients?.find(p => p.id === effectivePatientId) || null;
  }, [patients, effectivePatientId]);

  // Active zone = hovered or selected
  const activeZone = useMemo(() => {
    const id = hoveredZone?.id || selectedRegion;
    return STATIC_ZONES.find(z => z.id === id) || STATIC_ZONES[0];
  }, [hoveredZone, selectedRegion]);

  const effectiveRiskLevel = backendRiskLevel ?? regionalData?.riskLevel ?? 'high';
  const rs = RISK_CFG[effectiveRiskLevel] ?? RISK_CFG.high;
  const currentRoiNote = roiNotes?.[selectedRegion] ?? '';

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      setIsFullscreen(true);
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => { });
      }
    } else {
      setIsFullscreen(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => { });
      }
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFullscreen]);

  if (isCaseLoading) {
    return <Planning3DSkeleton />;
  }

  if (!effectivePatientId || !currentPatient) {
    return (
      <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/40 rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 animate-fade-in">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-100 text-blue-600 ring-8 ring-blue-50/80 shadow-inner">
            <Box size={32} />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            No 3D Bone Model Loaded
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm sm:text-base leading-relaxed">
            The workspace has been reset. To view the interactive 3D anatomical model, load-bearing stress zones, and regional microarchitecture analyses, please select a patient case or add a new one.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
          {/* Add New Case */}
          <div
            onClick={() => setIsNewCaseModalOpen(true)}
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
                Create a new case with clinical indication and biomarkers to generate patient-specific 3D anatomical models.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs sm:text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
              <span>Open Case Creator</span>
              <ChevronRight size={16} className="ml-1" />
            </div>
          </div>

          {/* Select from Dashboard */}
          <div
            onClick={() => navigate('/dashboard')}
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
                Select an existing patient profile from your dashboard to view the associated 3D bone geometry and DEXA T-Scores.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs sm:text-sm font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
              <span>View Dashboard Cases</span>
              <ChevronRight size={16} className="ml-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              3D Surgical Planning &amp; Endocrine Analytics
            </h2>
            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-black ${rs.badge}`}>
              <span className={`w-2 h-2 rounded-full ${rs.dot} animate-pulse`} />
              {effectiveRiskLevel === 'high' ? 'High Risk Active' : 'Normal Profile'}
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              THA Workflow
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            <span className="text-red-600 font-bold">1 critical zone</span> · <span className="text-orange-600 font-bold">1 elevated</span> · Interactive longitudinal curves synchronized with 3D bone risk shading
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={() => navigate(`/patients/${effectivePatientId}/assessment`)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200"
          >
            <Brain size={14} />
            <span className="hidden xs:inline">AI Assessment</span>
          </button>
          <button
            onClick={() => navigate(`/patients/${effectivePatientId}/summary`)}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/25 transition cursor-pointer"
          >
            <FileText size={14} />
            <span>Summary</span>
            <ArrowUpRight size={13} className="hidden sm:inline" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* ── 3D Viewport (7 Cols on desktop, 100% full screen when active) ── */}
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-3 sm:p-4' : 'lg:col-span-7'} flex flex-col gap-3 min-w-0 max-w-full`}>
          {/* Anatomy strip / DICOM Workstation Header */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 px-3.5 sm:px-4 py-2.5 flex items-center justify-between shadow-sm min-w-0">
            <div className="flex items-center gap-2 min-w-0 truncate">
              <div className="flex items-center gap-1.5 pr-2 sm:pr-3 border-r border-slate-700 shrink-0">
                <Bone size={14} className="text-blue-400" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden xs:inline">3D WORKSTATION</span>
              </div>
              <span className="text-xs font-bold text-slate-100 truncate">
                Femur Mesh • {currentPatient.name} ({currentPatient.id})
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium shrink-0">
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                <Compass size={11} className="text-cyan-400" /> 0.4mm
              </span>
              <span className="hidden md:inline">F, {currentPatient.age || 64} • Density Map Active</span>
            </div>
          </div>

          {/* Viewer card */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col flex-1 min-h-[440px] sm:min-h-[500px] lg:min-h-[560px] min-w-0 max-w-full relative">
            {/* Floating Top Center Exit Fullscreen Pill */}
            {isFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-indigo-950/90 backdrop-blur-md border border-indigo-500/60 rounded-full text-xs font-black text-indigo-200 shadow-2xl hover:bg-indigo-900 transition animate-fade-in pointer-events-auto cursor-pointer"
              >
                <Minimize2 size={13} />
                <span>Exit Fullscreen Mode (Esc)</span>
              </button>
            )}

            {/* Toolbar */}
            <div className="px-3 sm:px-4 py-2 bg-[#0a0f1e] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 z-10 min-w-0">
              <div className="flex items-center gap-1 p-0.5 bg-slate-900/60 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none max-w-full">
                {[
                  { id: 'anatomical', label: 'Anatomical', ac: 'bg-slate-700 text-slate-100' },
                  { id: 'heatmap', label: 'Risk Heatmap', ac: 'bg-orange-600 text-white shadow-md shadow-orange-600/30' },
                  { id: 'xray', label: 'X-Ray', ac: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' },
                  { id: 'wireframe', label: 'Wireframe', ac: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' },
                  { id: 'mesh', label: 'Mesh', ac: 'bg-teal-600 text-white shadow-md shadow-teal-600/30' },
                ].map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => setRenderMode(btn.id)}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition whitespace-nowrap cursor-pointer ${renderMode === btn.id ? btn.ac : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={() => setShowAnnotations(!showAnnotations)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${showAnnotations
                    ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                  title="Toggle 3D Bone Diagram Annotations"
                >
                  <Tag size={12} />
                  <span className="hidden sm:inline">Annotations</span>
                </button>

                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 text-[10px] sm:text-[11px] font-bold text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>1 critical</span>
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>1 elevated</span>
                </div>

                {/* Play / Pause 3D Auto-Rotation */}
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border transition text-xs font-bold cursor-pointer ${autoRotate
                    ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-sm shadow-cyan-500/20'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  title={autoRotate ? 'Pause 3D Auto-Rotation' : 'Play 3D Auto-Rotation'}
                >
                  {autoRotate ? <Pause size={12} className="fill-current" /> : <Play size={12} className="fill-current ml-0.5" />}
                  <span className="hidden sm:inline">{autoRotate ? 'Pause' : 'Play'}</span>
                </button>

                {/* Fullscreen Button */}
                <button
                  onClick={toggleFullscreen}
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border transition text-xs font-bold cursor-pointer ${isFullscreen
                    ? 'bg-indigo-600/30 border-indigo-500/60 text-indigo-200 shadow-sm shadow-indigo-500/20'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  title={isFullscreen ? 'Exit Fullscreen View (Esc)' : 'Expand to Fullscreen 3D Workstation'}
                >
                  {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                  <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
                </button>
              </div>
            </div>

            {/* 3D Canvas */}
            <div className="flex-1 relative w-full h-full min-w-0 max-w-full overflow-hidden">
              <BoneModelViewer
                viewAngle={viewAngle}
                heatmap={renderMode === 'heatmap'}
                wireframe={renderMode === 'wireframe'}
                meshMode={renderMode === 'mesh'}
                xray={renderMode === 'xray'}
                showAnnotations={showAnnotations}
                autoRotate={autoRotate}
                isFullscreen={isFullscreen}
                selectedRegion={selectedRegion}
                onSelectRegion={(id) => { setSelectedRegion(id); setSidebarTab('anatomy'); }}
                onZoneHover={setHoveredZone}
                onViewAngleChange={setViewAngle}
                onToggleAnnotations={setShowAnnotations}
                onToggleFullscreen={toggleFullscreen}
                onXrayChange={(x) => {
                  if (x) setRenderMode('xray');
                  else if (renderMode === 'xray') setRenderMode('heatmap');
                }}
              />
            </div>

            {/* Bottom Scan Analysis Footer Bar — matching reference monitor */}
            <div className="px-4 py-2.5 bg-slate-900/95 border-t border-slate-800 text-xs font-semibold text-slate-300 flex flex-wrap items-center justify-between gap-2 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">Scan Analysis</span>
                <span className="text-slate-600">|</span>
                <span className="font-bold text-slate-100">Osteopenia (T-Score: -2.3)</span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-400 font-bold">Hip Fracture Risk: Moderate (9.4%)</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> T-Score &gt; 1.0</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> T-Score &lt; -2.5</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Clinical Sidebar (5 Cols on desktop) ── */}
        <div className="lg:col-span-5 space-y-4 min-w-0 max-w-full overflow-hidden flex flex-col">
          {/* Multi-Tab Switcher (Curves, Anatomy, Biomarkers) */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-1.5 flex shadow-sm min-w-0 overflow-x-auto">
            <button
              onClick={() => setSidebarTab('curves')}
              className={`flex-1 py-2 px-2.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${sidebarTab === 'curves'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <LineChart size={13} className="shrink-0" />
              <span className="truncate">Endocrine Graphs</span>
            </button>
            <button
              onClick={() => setSidebarTab('anatomy')}
              className={`flex-1 py-2 px-2.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${sidebarTab === 'anatomy'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <Bone size={13} className="shrink-0" />
              <span className="truncate">Anatomy &amp; Notes</span>
            </button>
            <button
              onClick={() => setSidebarTab('biomarkers')}
              className={`flex-1 py-2 px-2.5 text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${sidebarTab === 'biomarkers'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              <FlaskConical size={13} className="shrink-0" />
              <span className="truncate">Lab Panel</span>
            </button>
          </div>

          {/* Tab 1: Endocrine Profile & Biomarker Curves */}
          {sidebarTab === 'curves' && (
            <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3.5 sm:p-4 shadow-xl space-y-3.5 min-w-0 max-w-full overflow-hidden">
              <EndocrineTrendChart biomarkers={biomarkers} patientName={currentPatient.name} />
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between min-w-0">
                <button
                  onClick={() => setSidebarTab('anatomy')}
                  className="w-full py-2.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Crosshair size={13} />
                  <span>Inspect 3D Anatomical Risk Zones</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Zone Inspection & Clinical Notes */}
          {sidebarTab === 'anatomy' && (
            <div className="space-y-4 min-w-0 max-w-full overflow-hidden">
              <ZoneInspectionPanel zone={activeZone} />
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm min-w-0 max-w-full overflow-hidden">
                <div className="flex items-center justify-between min-w-0">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1 truncate">
                    <FileText size={10} className="shrink-0" /> Planning Notes ({activeZone?.label})
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0">Auto-saved</span>
                </div>
                <textarea
                  rows={3}
                  value={currentRoiNote}
                  onChange={(e) => updateRoiNote(selectedRegion, e.target.value)}
                  onBlur={() => persistRoiNote(selectedRegion)}
                  placeholder="Add region-specific notes or surgical precautions..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Lab Biomarkers Panel */}
          {sidebarTab === 'biomarkers' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm min-w-0 max-w-full overflow-hidden">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Synchronized Lab Panel</p>
              <div className="space-y-2 min-w-0">
                {BIOMARKER_INPUTS.map(item => {
                  const b = biomarkers?.[item.key] || {};
                  const status = b.status || 'normal';
                  return (
                    <div key={item.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1 text-xs mb-1 min-w-0">
                        <span className="font-bold text-slate-700 truncate">{item.fullLabel}</span>
                        <span className="font-black text-slate-900 font-mono shrink-0">{b.value ?? '—'} <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span></span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Ref: {item.ref}</span>
                        <span className={`font-bold uppercase ${status === 'elevated' ? 'text-red-600' : status === 'low' ? 'text-amber-600' : 'text-teal-600'}`}>{status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
