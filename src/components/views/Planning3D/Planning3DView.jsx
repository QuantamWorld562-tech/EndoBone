import { useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Activity,
  AlertTriangle,
  FileDown,
  Layers,
  Bone,
  Eye,
  ChevronRight,
  Play,
  Pause,
  Grid,
  Sparkles,
  Compass,
  FlaskConical,
  Edit3,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import { usePatientContext } from '../../../context/PatientDataContext';
import BoneModelViewer from './BoneModelViewer';

// ─────────────────────────────────────────────────────────────
// Bone Model Registry
// ─────────────────────────────────────────────────────────────
const BONE_MODELS = [
  {
    id: 'skeleton',
    label: 'Full Skeleton',
    emoji: '🦴',
    path: '/models/skeleton.glb',
    regionKey: 'proximal-femur',
    category: 'Systemic',
    note: 'Whole body axial & appendicular system',
  },
  {
    id: 'femur',
    label: 'Femur (Thigh)',
    emoji: '🦵',
    path: '/models/femur.glb',
    regionKey: 'proximal-femur',
    category: 'Lower Limb',
    note: 'Femoral head, neck, trochanter & shaft',
  },
  {
    id: 'tibia',
    label: 'Tibia & Fibula',
    emoji: '🦵',
    path: '/models/tibia.glb',
    regionKey: 'distal-radius',
    category: 'Lower Limb',
    note: 'Weight-bearing tibial plateau & shaft',
  },
  {
    id: 'skull',
    label: 'Skull / Cranium',
    emoji: '💀',
    path: '/models/skull.glb',
    regionKey: 'vertebral-body',
    category: 'Axial Skeleton',
    note: 'Complete cranial vault and facial skeleton',
  },
  {
    id: 'hand',
    label: 'Upper Extremity',
    emoji: '💪',
    path: '/models/hand.glb',
    regionKey: 'distal-radius',
    category: 'Upper Limb',
    note: 'Left arm, radius, ulna and humerus',
  },
  {
    id: 'spine',
    label: 'Lumbar Spine',
    emoji: '🪱',
    path: '/models/spine.glb',
    regionKey: 'vertebral-body',
    category: 'Spine',
    note: 'L1–L5 lumbar vertebral bodies & pedicles',
  },
  {
    id: 'ribcage',
    label: 'Thoracic Ribcage',
    emoji: '🪱',
    path: '/models/ribcage.glb',
    regionKey: 'vertebral-body',
    category: 'Thorax',
    note: 'True, false ribs & costal cartilage frame',
  },
  {
    id: 'pelvis-m',
    label: 'Male Pelvis',
    emoji: '🦴',
    path: '/models/pelvis_male.glb',
    regionKey: 'femoral-neck',
    category: 'Pelvic Girdle',
    note: 'Ilium, ischium, pubis & acetabulum',
  },
  {
    id: 'pelvis-f',
    label: 'Female Pelvis',
    emoji: '🦴',
    path: '/models/pelvis_female.glb',
    regionKey: 'femoral-neck',
    category: 'Pelvic Girdle',
    note: 'Gynecoid pelvic inlet & iliac crest',
  },
];

const BIOMARKER_INPUTS = [
  { key: 'pth', label: 'Parathyroid Hormone (PTH)', unit: 'pg/mL', ref: '15.0–65.0', step: 1 },
  { key: 'vitaminD', label: '25-OH Vitamin D', unit: 'ng/mL', ref: '30.0–100.0', step: 1 },
  { key: 'calcium', label: 'Serum Calcium', unit: 'mg/dL', ref: '8.6–10.3', step: 0.1 },
  { key: 'phosphate', label: 'Inorganic Phosphate', unit: 'mg/dL', ref: '2.5–4.5', step: 0.1 },
  { key: 'alp', label: 'Alkaline Phosphatase (ALP)', unit: 'U/L', ref: '44–147', step: 1 },
  { key: 'ctx', label: 'CTX-I (Resorption)', unit: 'pg/mL', ref: '< 300', step: 10 },
];

function ModelTab({ model, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      title={model.note}
      className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
        isActive
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-[1.03] ring-2 ring-blue-400/40'
          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/50'
      }`}
    >
      <span className="text-sm leading-none group-hover:scale-110 transition-transform">{model.emoji}</span>
      <span>{model.label}</span>
    </button>
  );
}

export default function Planning3DView({ patientId }) {
  const params = useParams();
  const navigate = useNavigate();
  const effectivePatientId = patientId || params.patientId || 'PEB-8842-A';

  const {
    biomarkers,
    updateBiomarker,
    selectedRegion,
    setSelectedRegion,
    roiNotes,
    updateRoiNote,
    regionalData,
    assessment,
    regionalAnalysisDB,
  } = usePatientContext();

  const [selectedModelId, setSelectedModelId] = useState('femur');
  const [renderMode, setRenderMode] = useState('heatmap'); // Default to heatmap to show dynamic biomarker reaction
  const [viewAngle, setViewAngle] = useState('3d');
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);

  // Right sidebar tab state: 'anatomy' | 'biomarkers'
  const [sidebarTab, setSidebarTab] = useState('anatomy');

  const controlsRef = useRef(null);
  const activeModel = BONE_MODELS.find((m) => m.id === selectedModelId) || BONE_MODELS[0];
  const regionKeys = Object.keys(regionalAnalysisDB[effectivePatientId] || { 'proximal-femur': {}, 'vertebral-body': {}, 'acetabulum': {} });

  const handleModelSelect = useCallback((modelId) => {
    setSelectedModelId(modelId);
    setViewerKey((k) => k + 1);
  }, []);

  const handleReset = useCallback(() => {
    setViewAngle('3d');
    setViewerKey((k) => k + 1);
  }, []);

  const statusColor = {
    high: {
      card: 'bg-red-50/90 border-red-200 ring-red-200',
      text: 'text-red-700',
      chip: 'bg-red-100 text-red-700 ring-red-200',
      dot: 'bg-red-600',
      value: 'text-red-600',
      banner: 'bg-red-600 text-white',
    },
    moderate: {
      card: 'bg-amber-50/90 border-amber-200 ring-amber-200',
      text: 'text-amber-700',
      chip: 'bg-amber-100 text-amber-700 ring-amber-200',
      dot: 'bg-amber-500',
      value: 'text-amber-600',
      banner: 'bg-amber-500 text-white',
    },
    low: {
      card: 'bg-teal-50/90 border-teal-200 ring-teal-200',
      text: 'text-teal-700',
      chip: 'bg-teal-100 text-teal-700 ring-teal-200',
      dot: 'bg-teal-500',
      value: 'text-teal-600',
      banner: 'bg-teal-600 text-white',
    },
  }[regionalData.riskLevel || 'moderate'];

  const currentRoiNote = roiNotes[selectedRegion] || '';

  return (
    <div className="space-y-5">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Unified 3D & Metabolic Planning</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              Interactive GLB + Biochemical Engine
            </span>
          </div>
          <p className="text-slate-600 mt-1 text-sm">
            Adjust metabolic biomarkers in real-time or click on the 3D bone to inspect and annotate targeted regions of interest.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => navigate(`/patients/${effectivePatientId}/assessment`)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition"
          >
            <Sparkles size={14} />
            Full AI Assessment
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* ── Model Selection Strip ───────────────────────────────── */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 px-4 py-3 shadow-xl">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider whitespace-nowrap pl-1">
            <Bone size={14} className="text-blue-400" />
            <span>Select Anatomy:</span>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div className="flex items-center gap-2 flex-nowrap">
            {BONE_MODELS.map((model) => (
              <ModelTab
                key={model.id}
                model={model}
                isActive={selectedModelId === model.id}
                onClick={() => handleModelSelect(model.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Workspace Grid ───────────────────────────────────── */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* 3D Viewport Column */}
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4' : 'lg:col-span-3'} space-y-4`}>
          <div className={`bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col ${isFullscreen ? 'h-full' : ''}`}>
            
            {/* Top Toolbar: Render Modes & Anatomical Planes */}
            <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              
              {/* Shading / Diagnostic Mode */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setRenderMode('anatomical')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    renderMode === 'anatomical'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers size={13} />
                  Anatomical
                </button>
                <button
                  onClick={() => setRenderMode('heatmap')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    renderMode === 'heatmap'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Activity size={13} />
                  Metabolic Risk
                  <span className={`w-2 h-2 rounded-full ${regionalData.riskLevel === 'high' ? 'bg-red-400 animate-ping' : 'bg-amber-400'}`} />
                </button>
                <button
                  onClick={() => setRenderMode('xray')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    renderMode === 'xray'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles size={13} />
                  Radiograph (X-Ray)
                </button>
                <button
                  onClick={() => setRenderMode('wireframe')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    renderMode === 'wireframe'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Grid size={13} />
                  Mesh
                </button>
              </div>

              {/* Anatomical Camera Planes */}
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 px-2 flex items-center gap-1">
                  <Compass size={12} />
                  Plane:
                </span>
                {[
                  { id: '3d', label: '3D View' },
                  { id: 'coronal', label: 'Coronal (Front)' },
                  { id: 'sagittal', label: 'Sagittal (Side)' },
                  { id: 'axial', label: 'Axial (Top)' },
                ].map((plane) => (
                  <button
                    key={plane.id}
                    onClick={() => setViewAngle(plane.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      viewAngle === plane.id
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {plane.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3D Canvas Container */}
            <div
              className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden flex-1"
              style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '580px' }}
            >
              {/* Background Grid & Lighting Vignette */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.15) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(37,99,235,0.15),transparent_70%)] pointer-events-none" />

              {/* Three.js Canvas */}
              <BoneModelViewer
                key={`${selectedModelId}-${viewerKey}`}
                modelPath={activeModel.path}
                modelLabel={activeModel.label}
                viewAngle={viewAngle}
                heatmap={renderMode === 'heatmap'}
                xray={renderMode === 'xray'}
                wireframe={renderMode === 'wireframe'}
                autoRotate={autoRotate}
                riskLevel={regionalData.riskLevel}
                selectedRegion={selectedRegion}
                onSelectRegion={(reg) => setSelectedRegion(reg)}
                onResetRef={(node) => {
                  controlsRef.current = node;
                }}
              />

              {/* Floating Quick-Action Bar */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
                <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-2xl text-slate-300">
                  <button
                    onClick={() => setAutoRotate((r) => !r)}
                    title={autoRotate ? 'Pause Rotation' : 'Auto Rotate'}
                    className={`p-2 rounded-xl transition ${
                      autoRotate ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {autoRotate ? <Pause size={15} /> : <Play size={15} />}
                  </button>

                  <button
                    onClick={handleReset}
                    title="Reset View Orientation"
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition"
                  >
                    <RotateCw size={15} />
                  </button>

                  <div className="w-px h-5 bg-slate-700 mx-0.5" />

                  <button
                    onClick={() => setIsFullscreen((f) => !f)}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen 3D Viewer'}
                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition"
                  >
                    {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                  </button>
                </div>

                <div className="px-3 py-2 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-700/80 text-[11px] font-semibold text-slate-300 shadow-xl hidden sm:flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                  <span>Click 3D Mesh to Select ROI · Drag: Rotate · Scroll: Zoom</span>
                </div>
              </div>

              {/* Active Model & Selected ROI Indicator Tags */}
              <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
                <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 text-xs text-slate-200 font-bold flex items-center gap-2 shadow-lg">
                  <Eye size={13} className="text-blue-400" />
                  <span>{activeModel.label}</span>
                  <span className="text-slate-500 font-normal">| {activeModel.category}</span>
                </div>
                <div className="px-3 py-1 bg-blue-600/90 backdrop-blur-md rounded-xl text-[11px] text-white font-bold flex items-center gap-1.5 shadow-lg border border-blue-400/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>ROI: {regionalData.location || selectedRegion}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Unified Control Column: Anatomy & Notes + Biomarker Editor */}
        {!isFullscreen && (
          <div className="space-y-4">
            {/* Tab Selector */}
            <div className="grid grid-cols-2 p-1 bg-slate-200 rounded-2xl">
              <button
                onClick={() => setSidebarTab('anatomy')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'anatomy'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers size={13} />
                Anatomy & ROI Notes
              </button>
              <button
                onClick={() => setSidebarTab('biomarkers')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  sidebarTab === 'biomarkers'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FlaskConical size={13} />
                Biomarker Inputs
              </button>
            </div>

            {/* TAB 1: Anatomy & ROI Notes */}
            {sidebarTab === 'anatomy' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Region Selector Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-extrabold text-slate-900">Region of Interest (ROI)</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                      Click Model or Select
                    </span>
                  </div>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  >
                    {regionKeys.map((k) => (
                      <option key={k} value={k}>
                        {regionalAnalysisDB[effectivePatientId]?.[k]?.location || k}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 font-medium">
                    Anatomy: <span className="text-blue-700 font-bold">{regionalData.anatomy}</span>
                  </p>
                </div>

                {/* Volumetric Metrics Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-3">
                    Volumetric Structural Metrics
                  </h4>
                  <div className="space-y-2.5">
                    {Object.entries(regionalData.metrics || {}).map(([k, v]) => {
                      const key = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
                      const isEstimated = k.toLowerCase().includes('strength') && regionalData.riskLevel === 'high';
                      return (
                        <div key={k} className="pb-2 border-b border-slate-100 last:border-0 last:pb-0 flex items-center justify-between">
                          <p className="text-xs text-slate-500 font-semibold">{key}</p>
                          <p className={`text-xs font-black ${isEstimated ? statusColor.value : 'text-slate-900'}`}>{v}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ROI Surgeon Planning Notes Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-xs">
                      <Edit3 size={13} className="text-blue-600" />
                      <span>ROI Planning Annotation</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-bold">Auto-saved</span>
                  </div>
                  <textarea
                    rows={3}
                    value={currentRoiNote}
                    onChange={(e) => updateRoiNote(effectivePatientId, selectedRegion, e.target.value)}
                    placeholder={`Enter custom clinical surgical notes for ${regionalData.location}...`}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none font-medium leading-relaxed bg-slate-50/50"
                  />
                </div>

                {/* Regional Status Warning Card */}
                <div className={`rounded-2xl border-2 p-4 ring-1 ${statusColor.card}`}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className={statusColor.text} />
                    <p className={`text-xs font-black ${statusColor.text}`}>
                      Status: {regionalData.status}
                    </p>
                  </div>
                  <p className={`text-[11px] font-semibold mt-1.5 ${statusColor.text} opacity-90`}>
                    Overall Metabolic Quality Risk: <span className="font-black">{assessment.overallQualityRisk}%</span>
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: Biomarker Editor (Live Unified Editing) */}
            {sidebarTab === 'biomarkers' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 animate-in fade-in duration-200">
                <div>
                  <div className="flex items-center gap-1.5 text-blue-700 font-black text-xs uppercase tracking-wider mb-1">
                    <FlaskConical size={14} />
                    <span>Live Chemical Inputs</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Modify endocrine levels below. The 3D model and AI assessment will adjust instantly.
                  </p>
                </div>

                <div className="space-y-3">
                  {BIOMARKER_INPUTS.map((inp) => {
                    const currentVal = biomarkers?.[inp.key]?.value ?? 0;
                    const status = biomarkers?.[inp.key]?.status || 'normal';
                    return (
                      <div key={inp.key} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{inp.label}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              status === 'elevated'
                                ? 'bg-red-100 text-red-700'
                                : status === 'deficient' || status === 'low'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-teal-100 text-teal-700'
                            }`}
                          >
                            {status.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step={inp.step}
                            value={currentVal}
                            onChange={(e) => updateBiomarker(effectivePatientId, inp.key, e.target.value)}
                            className="w-24 px-2.5 py-1 text-sm font-black text-slate-900 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-xs font-semibold text-slate-500">{inp.unit}</span>
                          <span className="text-[10px] text-slate-400 font-medium ml-auto">Ref: {inp.ref}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={() => navigate(`/patients/${effectivePatientId}/assessment`)}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Sparkles size={14} />
                  Calculate Comprehensive Risk
                  <ChevronRight size={13} />
                </button>
              </div>
            )}

            {/* Action CTA */}
            <button
              onClick={() => navigate(`/patients/${effectivePatientId}/summary`)}
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <FileDown size={15} />
              Export Final Pre-Surgical Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
