import { useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Maximize2, Minimize2, RotateCw, Activity, AlertTriangle,
  FileDown, Layers, Bone, Eye, ChevronRight, Play, Pause,
  Sparkles, FlaskConical, Edit3, ArrowUpRight, TrendingUp,
  TrendingDown, Minus, Brain, Crosshair,
} from 'lucide-react';
import { usePatientContext } from '../../../context/PatientDataContext';
import BoneModelViewer from './BoneModelViewer';

// ─────────────────────────────────────────────────────────────
// Bone Model Registry
// ─────────────────────────────────────────────────────────────
const BONE_MODELS = [
  { id:'skeleton', label:'Full Skeleton',   emoji:'🦴', path:'/storage/bones/skeleton.glb',      category:'Systemic',       note:'Whole body axial & appendicular system' },
  { id:'femur',    label:'Femur',           emoji:'🦵', path:'/storage/bones/femur.glb',         category:'Lower Limb',     note:'Femoral head, neck, trochanter & shaft' },
  { id:'tibia',    label:'Tibia & Fibula',  emoji:'🦵', path:'/storage/bones/tibia.glb',         category:'Lower Limb',     note:'Weight-bearing tibial plateau & shaft' },
  { id:'skull',    label:'Skull',           emoji:'💀', path:'/storage/bones/skull.glb',         category:'Axial Skeleton', note:'Complete cranial vault and facial skeleton' },
  { id:'hand',     label:'Upper Limb',      emoji:'💪', path:'/storage/bones/hand.glb',          category:'Upper Limb',     note:'Left arm, radius, ulna and humerus' },
  { id:'spine',    label:'Lumbar Spine',    emoji:'🪱', path:'/storage/bones/spine.glb',         category:'Spine',          note:'L1–L5 lumbar vertebral bodies & pedicles' },
  { id:'ribcage',  label:'Ribcage',         emoji:'🫀', path:'/storage/bones/ribcage.glb',       category:'Thorax',         note:'True, false ribs & costal cartilage frame' },
  { id:'pelvis-m', label:'Pelvis (M)',      emoji:'🦴', path:'/storage/bones/pelvis_male.glb',   category:'Pelvic Girdle',  note:'Ilium, ischium, pubis & acetabulum' },
  { id:'pelvis-f', label:'Pelvis (F)',      emoji:'🦴', path:'/storage/bones/pelvis_female.glb', category:'Pelvic Girdle',  note:'Gynecoid pelvic inlet & iliac crest' },
];

const BIOMARKER_INPUTS = [
  { key:'pth',       label:'PTH',        fullLabel:'Parathyroid Hormone', unit:'pg/mL', ref:'15–65',    step:1   },
  { key:'vitaminD',  label:'Vitamin D',  fullLabel:'25-OH Vitamin D',     unit:'ng/mL', ref:'30–100',   step:1   },
  { key:'calcium',   label:'Calcium',    fullLabel:'Serum Calcium',       unit:'mg/dL', ref:'8.6–10.3', step:0.1 },
  { key:'phosphate', label:'Phosphate',  fullLabel:'Inorganic Phosphate', unit:'mg/dL', ref:'2.5–4.5',  step:0.1 },
  { key:'alp',       label:'ALP',        fullLabel:'Alkaline Phosphatase',unit:'U/L',   ref:'44–147',   step:1   },
  { key:'ctx',       label:'CTX-I',      fullLabel:'Bone Resorption',     unit:'pg/mL', ref:'< 300',    step:10  },
];

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function buildZoneRisks(patientId, regionalAnalysisDB, dynamicRegionalData, assessment) {
  const patientRegions = regionalAnalysisDB[patientId] ?? regionalAnalysisDB['PEB-8842-A'] ?? {};
  return Object.entries(patientRegions).map(([regionKey, regionData]) => {
    const isActive = regionKey === dynamicRegionalData?.id || regionKey === dynamicRegionalData?.canonicalId;
    const riskLevel = isActive
      ? (dynamicRegionalData?.riskLevel ?? regionData.riskLevel ?? 'low')
      : (regionData.riskLevel ?? 'low');
    const structInsight = assessment?.insights?.find(i => i.type === 'structural');
    const note = regionData.observation ?? structInsight?.text ?? assessment?.clinicalNotes ?? '';
    return { id: regionKey, label: regionData.location ?? regionKey, riskLevel, note };
  });
}

const RISK_STYLE = {
  high:     { dot:'bg-red-500',   badge:'bg-red-50 text-red-700 border-red-200',     text:'text-red-600',   banner:'border-red-200 bg-red-50/60',     icon:'text-red-500' },
  moderate: { dot:'bg-amber-400', badge:'bg-amber-50 text-amber-700 border-amber-200', text:'text-amber-600', banner:'border-amber-200 bg-amber-50/60', icon:'text-amber-500' },
  low:      { dot:'bg-teal-400',  badge:'bg-teal-50 text-teal-700 border-teal-200',   text:'text-teal-600',  banner:'border-teal-200 bg-teal-50/60',   icon:'text-teal-500' },
};

function trendIcon(direction) {
  if (direction === 'up')   return <TrendingUp   size={10} className="text-red-500" />;
  if (direction === 'down') return <TrendingDown size={10} className="text-amber-500" />;
  return <Minus size={10} className="text-teal-500" />;
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

function ModelChip({ model, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      title={model.note}
      className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
        isActive
          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
      }`}
    >
      <span className="text-sm leading-none">{model.emoji}</span>
      <span>{model.label}</span>
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-[0.18em] mb-2.5">
      {children}
    </p>
  );
}

function MetricRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-[11px] text-slate-500 font-medium">{label}</span>
      <span className={`text-[11px] font-bold ${highlight ? 'text-red-600' : 'text-slate-800'}`}>{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// View
// ─────────────────────────────────────────────────────────────

export default function Planning3DView({ patientId }) {
  const params   = useParams();
  const navigate = useNavigate();
  const effectivePatientId = patientId || params.patientId || 'PEB-8842-A';

  const getModelUrl = (path) => {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    const baseUrl = apiUrl.replace(/\/api\/?$/, '');
    return baseUrl ? `${baseUrl}${path}` : path;
  };

  const {
    biomarkers, updateBiomarker,
    selectedRegion, setSelectedRegion,
    roiNotes, updateRoiNote, persistRoiNote,
    regionalData, assessment, regionalAnalysisDB,
    backendRiskLevel,
  } = usePatientContext();

  const [selectedModelId, setSelectedModelId] = useState('femur');
  const [renderMode,      setRenderMode]       = useState('heatmap');
  const [viewAngle,       setViewAngle]        = useState('overview');
  const [xrayOn,          setXrayOn]           = useState(false);
  const [autoRotate,      setAutoRotate]       = useState(false);
  const [isFullscreen,    setIsFullscreen]     = useState(false);
  const [viewerKey,       setViewerKey]        = useState(0);
  const [sidebarTab,      setSidebarTab]       = useState('anatomy');

  const controlsRef  = useRef(null);
  const activeModel  = BONE_MODELS.find(m => m.id === selectedModelId) ?? BONE_MODELS[0];
  const regionKeys   = Object.keys(regionalAnalysisDB[effectivePatientId] ?? { 'proximal-femur':{}, 'vertebral-body':{}, acetabulum:{} });

  const zoneRisks = useMemo(
    () => buildZoneRisks(effectivePatientId, regionalAnalysisDB, regionalData, assessment),
    [effectivePatientId, regionalAnalysisDB, regionalData, assessment],
  );

  const clinicalNote = useMemo(() => {
    return assessment?.insights?.find(i => i.type === 'structural')?.text ?? assessment?.clinicalNotes ?? '';
  }, [assessment]);

  const effectiveRiskLevel = backendRiskLevel ?? regionalData?.riskLevel ?? 'moderate';
  const rs = RISK_STYLE[effectiveRiskLevel] ?? RISK_STYLE.moderate;
  const currentRoiNote = roiNotes?.[selectedRegion] ?? '';

  const handleModelSelect = useCallback(id => {
    setSelectedModelId(id);
    setViewerKey(k => k + 1);
  }, []);

  const handleReset = useCallback(() => {
    setViewAngle('overview');
    setViewerKey(k => k + 1);
  }, []);

  const handleXrayChange = useCallback(enabled => {
    setXrayOn(enabled);
    if (enabled) setRenderMode('xray');
    else if (renderMode === 'xray') setRenderMode('heatmap');
  }, [renderMode]);

  const handleToolbarMode = useCallback(mode => {
    setRenderMode(mode);
    setXrayOn(mode === 'xray');
  }, []);

  const highCount     = zoneRisks.filter(z => z.riskLevel === 'high').length;
  const moderateCount = zoneRisks.filter(z => z.riskLevel === 'moderate').length;

  return (
    <div className="space-y-0 h-full">

      {/* ── Page header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              3D Surgical Planning
            </h2>
            {/* Live risk indicator */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${rs.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${rs.dot} ${effectiveRiskLevel === 'high' ? 'animate-pulse' : ''}`} />
              {effectiveRiskLevel === 'high' ? 'High Risk Active' : effectiveRiskLevel === 'moderate' ? 'Moderate Risk' : 'Normal Profile'}
            </div>
          </div>
          <p className="text-sm text-slate-500">
            {highCount > 0 && <span className="text-red-600 font-semibold">{highCount} critical zone{highCount > 1 ? 's' : ''} · </span>}
            {moderateCount > 0 && <span className="text-amber-600 font-semibold">{moderateCount} elevated · </span>}
            Click or hover any zone for the AI clinical HUD
          </p>
        </div>
        <button
          onClick={() => navigate(`/patients/${effectivePatientId}/assessment`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all duration-150"
        >
          <Brain size={15} />
          Full AI Assessment
          <ArrowUpRight size={13} />
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">

        {/* ── 3D Viewport column ─────────────────────────────────── */}
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950' : 'lg:col-span-3'} flex flex-col gap-3`}>

          {/* Anatomy selector strip */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 px-3 py-2.5">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hidden">
              <div className="flex items-center gap-1.5 pr-2 border-r border-slate-700 flex-shrink-0">
                <Bone size={13} className="text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                  Anatomy
                </span>
              </div>
              {BONE_MODELS.map(model => (
                <ModelChip
                  key={model.id}
                  model={model}
                  isActive={selectedModelId === model.id}
                  onClick={() => handleModelSelect(model.id)}
                />
              ))}
            </div>
          </div>

          {/* Viewer card */}
          <div className={`bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col ${isFullscreen ? 'flex-1' : ''}`}>

            {/* Toolbar */}
            <div className="px-3 py-2 bg-[#0a0f1e] border-b border-slate-800/80 flex items-center justify-between gap-3">

              {/* Left: render mode pills */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-900/60 rounded-xl border border-slate-800">
                {[
                  { id:'anatomical', label:'Anatomical',    activeClass:'bg-slate-700 text-slate-100' },
                  { id:'heatmap',    label:'Risk Heatmap',  activeClass:'bg-orange-600/90 text-white'  },
                  { id:'xray',       label:'X-Ray',         activeClass:'bg-cyan-600/90 text-white'    },
                  { id:'wireframe',  label:'Wireframe',     activeClass:'bg-indigo-600/90 text-white'  },
                ].map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => handleToolbarMode(btn.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                      renderMode === btn.id
                        ? btn.activeClass + ' shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {btn.label}
                    {btn.id === 'heatmap' && renderMode === 'heatmap' && effectiveRiskLevel === 'high' && (
                      <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    )}
                  </button>
                ))}
              </div>

              {/* Right: zone tally + controls */}
              <div className="flex items-center gap-2">
                {/* Zone tally */}
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
                  {highCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      {highCount}
                    </span>
                  )}
                  {highCount > 0 && moderateCount > 0 && <span className="text-slate-700 text-[10px]">·</span>}
                  {moderateCount > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      {moderateCount}
                    </span>
                  )}
                  <span className="text-slate-600 text-[10px] font-medium ml-0.5">
                    {highCount > 0 || moderateCount > 0 ? 'zones flagged' : 'all clear'}
                  </span>
                </div>

                <div className="w-px h-5 bg-slate-800" />

                {/* Viewport controls */}
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={() => setAutoRotate(r => !r)}
                    title={autoRotate ? 'Pause' : 'Auto-rotate'}
                    className={`p-1.5 rounded-lg transition ${autoRotate ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
                  >
                    {autoRotate ? <Pause size={13} /> : <Play size={13} />}
                  </button>
                  <button
                    onClick={handleReset}
                    title="Reset camera"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                  >
                    <RotateCw size={13} />
                  </button>
                  <button
                    onClick={() => setIsFullscreen(f => !f)}
                    title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
                  >
                    {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas */}
            <div
              className="relative overflow-hidden flex-1"
              style={{
                height: isFullscreen ? 'calc(100vh - 52px)' : 580,
                background: 'radial-gradient(ellipse at 50% 40%, #0f172a 0%, #020617 100%)',
              }}
            >
              {/* Dot-grid texture */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle, rgba(148,163,184,0.08) 1px, transparent 1px)',
                  backgroundSize: '32px 32px',
                }}
              />
              {/* Vignette */}
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_50%,rgba(37,99,235,0.08),transparent_70%)]" />

              <BoneModelViewer
                key={`${selectedModelId}-${viewerKey}`}
                modelPath={getModelUrl(activeModel.path)}
                modelLabel={activeModel.label}
                viewAngle={viewAngle}
                heatmap={renderMode === 'heatmap'}
                xray={renderMode === 'xray' || xrayOn}
                wireframe={renderMode === 'wireframe'}
                autoRotate={autoRotate}
                riskLevel={effectiveRiskLevel}
                selectedRegion={selectedRegion}
                clinicalNote={clinicalNote}
                zoneRisks={zoneRisks}
                onSelectRegion={reg => setSelectedRegion(reg)}
                onViewAngleChange={p => setViewAngle(p)}
                onXrayChange={handleXrayChange}
                onResetRef={node => { controlsRef.current = node; }}
              />

              {/* Bottom-left status strip */}
              <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
                {/* Model + ROI tags */}
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/50 shadow-lg">
                  <Eye size={11} className="text-blue-400 flex-shrink-0" />
                  <span className="text-[10px] font-semibold text-slate-300">{activeModel.label}</span>
                  <span className="text-slate-600 text-[10px]">·</span>
                  <span className="text-[10px] text-slate-500">{activeModel.category}</span>
                </div>

                {selectedRegion && (
                  <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl backdrop-blur-md border shadow-lg text-[10px] font-bold ${
                    effectiveRiskLevel === 'high'
                      ? 'bg-red-950/80 border-red-700/40 text-red-300'
                      : effectiveRiskLevel === 'moderate'
                      ? 'bg-amber-950/80 border-amber-700/40 text-amber-300'
                      : 'bg-teal-950/80 border-teal-700/40 text-teal-300'
                  }`}>
                    <Crosshair size={11} className="flex-shrink-0" />
                    {regionalData?.location ?? selectedRegion}
                  </div>
                )}

                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700/40 text-[9px] text-slate-500 font-medium">
                  <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                  Hover · Click for AI HUD · Drag: Orbit · Scroll: Zoom
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right sidebar ──────────────────────────────────────── */}
        {!isFullscreen && (
          <div className="flex flex-col gap-4">

            {/* Tab bar */}
            <div className="flex p-1 bg-slate-100 rounded-xl gap-1">
              {[
                { id:'anatomy',    label:'Anatomy',   icon:<Layers size={11}/> },
                { id:'biomarkers', label:'Biomarkers', icon:<FlaskConical size={11}/> },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setSidebarTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    sidebarTab === t.id
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── ANATOMY TAB ─────────────────────────────────────── */}
            {sidebarTab === 'anatomy' && (
              <div className="flex flex-col gap-3">

                {/* Zone index card */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 pt-3.5 pb-2 border-b border-slate-100">
                    <SectionLabel>Zone Risk Index</SectionLabel>
                  </div>
                  <div className="p-2">
                    {zoneRisks.map(z => {
                      const zs = RISK_STYLE[z.riskLevel] ?? RISK_STYLE.moderate;
                      const isActive = selectedRegion === z.id;
                      return (
                        <button
                          key={z.id}
                          onClick={() => setSelectedRegion(z.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 last:mb-0 transition-all text-left group ${
                            isActive
                              ? 'bg-blue-50 ring-1 ring-blue-200 border border-blue-200'
                              : 'hover:bg-slate-50 border border-transparent'
                          }`}
                        >
                          {/* Risk dot */}
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${zs.dot} ${z.riskLevel === 'high' ? 'shadow-[0_0_6px_rgba(239,68,68,0.6)]' : ''}`} />
                          <span className="flex-1 text-xs font-semibold text-slate-700 min-w-0 truncate group-hover:text-slate-900">
                            {z.label}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${zs.badge}`}>
                            {z.riskLevel === 'low' ? 'Normal' : z.riskLevel}
                          </span>
                          {isActive && <ChevronRight size={11} className="text-blue-500 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ROI selector */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <SectionLabel>Region of Interest</SectionLabel>
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                      Click Model
                    </span>
                  </div>
                  <select
                    value={selectedRegion}
                    onChange={e => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 mb-2.5 cursor-pointer"
                  >
                    {regionKeys.map(k => (
                      <option key={k} value={k}>
                        {regionalAnalysisDB[effectivePatientId]?.[k]?.location ?? k}
                      </option>
                    ))}
                  </select>
                  {regionalData?.anatomy && (
                    <p className="text-[10px] text-slate-500">
                      <span className="text-slate-400">Anatomy · </span>
                      <span className="font-semibold text-blue-600">{regionalData.anatomy}</span>
                    </p>
                  )}
                </div>

                {/* Structural metrics */}
                {regionalData?.metrics && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <SectionLabel>Structural Metrics</SectionLabel>
                    {Object.entries(regionalData.metrics).map(([k, v]) => {
                      const label = k.replace(/([A-Z])/g,' $1').replace(/^./,s=>s.toUpperCase()).trim();
                      const isHigh = k.toLowerCase().includes('strength') && effectiveRiskLevel === 'high';
                      return <MetricRow key={k} label={label} value={v} highlight={isHigh} />;
                    })}
                  </div>
                )}

                {/* Surgeon annotation */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Edit3 size={11} className="text-blue-500" />
                      <SectionLabel>Planning Notes</SectionLabel>
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">Auto-saved</span>
                  </div>
                  <textarea
                    rows={3}
                    value={currentRoiNote}
                    onChange={e => updateRoiNote(effectivePatientId, selectedRegion, e.target.value)}
                    onBlur={e => persistRoiNote(effectivePatientId, selectedRegion, e.target.value)}
                    placeholder={`Surgical notes for ${regionalData?.location ?? selectedRegion}…`}
                    className="w-full px-3 py-2.5 text-xs border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none leading-relaxed bg-slate-50 placeholder-slate-400"
                  />
                </div>

                {/* Risk status banner */}
                <div className={`rounded-2xl border p-4 ${rs.banner}`}>
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle size={15} className={`${rs.icon} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${rs.text} mb-0.5`}>{regionalData?.status}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`text-[10px] font-semibold ${rs.text} opacity-80`}>
                          Metabolic Risk <span className="font-black">{assessment?.overallQualityRisk}%</span>
                        </span>
                        {assessment?.dexa_tscore && (
                          <span className={`text-[10px] font-semibold ${rs.text} opacity-70`}>
                            T-score {assessment.dexa_tscore}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Export button */}
                <button
                  onClick={() => navigate(`/patients/${effectivePatientId}/summary`)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all shadow-lg border border-slate-700"
                >
                  <FileDown size={13} />
                  Export Pre-Surgical Plan
                </button>
              </div>
            )}

            {/* ── BIOMARKERS TAB ─────────────────────────────────── */}
            {sidebarTab === 'biomarkers' && (
              <div className="flex flex-col gap-3">

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 pt-3.5 pb-2.5 border-b border-slate-100">
                    <SectionLabel>Live Metabolic Inputs</SectionLabel>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Edits instantly update the 3D heatmap
                    </p>
                  </div>

                  <div className="p-3 space-y-2">
                    {BIOMARKER_INPUTS.map(inp => {
                      const currentVal = biomarkers?.[inp.key]?.value ?? 0;
                      const status     = biomarkers?.[inp.key]?.status ?? 'normal';
                      const direction  = biomarkers?.[inp.key]?.trend ?? 'stable';

                      const statusStyle = status === 'elevated'
                        ? 'bg-red-50 border-red-200 text-red-700'
                        : status === 'deficient' || status === 'low'
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-teal-50 border-teal-200 text-teal-700';

                      return (
                        <div key={inp.key} className={`p-3 rounded-xl border ${statusStyle} space-y-2`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {trendIcon(direction)}
                              <span className="text-[11px] font-bold">{inp.fullLabel}</span>
                            </div>
                            <span className="text-[9px] font-extrabold uppercase tracking-wide opacity-70">
                              {status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              step={inp.step}
                              value={currentVal}
                              onChange={e => updateBiomarker(effectivePatientId, inp.key, e.target.value)}
                              className="w-20 px-2.5 py-1.5 text-sm font-black bg-white border border-current/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-current/30 text-current"
                            />
                            <span className="text-[10px] font-semibold opacity-70">{inp.unit}</span>
                            <span className="text-[9px] opacity-50 font-medium ml-auto">Ref: {inp.ref}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/patients/${effectivePatientId}/assessment`)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/25"
                >
                  <Sparkles size={13} />
                  Run Comprehensive AI Analysis
                  <ChevronRight size={12} />
                </button>

                <button
                  onClick={() => navigate(`/patients/${effectivePatientId}/summary`)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all border border-slate-700"
                >
                  <FileDown size={13} />
                  Export Pre-Surgical Plan
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
