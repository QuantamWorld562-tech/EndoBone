import { useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
} from 'lucide-react';
import { useRegionalAnalysis } from '../../../hooks';
import { regionalAnalysisDB } from '../../../data/mockData';
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

// ─────────────────────────────────────────────────────────────
// Model Tab Component
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Main Planning3D View Component
// ─────────────────────────────────────────────────────────────
export default function Planning3DView({ patientId }) {
  const params = useParams();
  const effectivePatientId = patientId || params.patientId || 'PEB-8842-A';
  const regions = regionalAnalysisDB[effectivePatientId] || {};
  const regionKeys = Object.keys(regions);

  const [selectedModelId, setSelectedModelId] = useState('femur');
  const [renderMode, setRenderMode] = useState('anatomical'); // 'anatomical' | 'heatmap' | 'xray' | 'wireframe'
  const [viewAngle, setViewAngle] = useState('3d'); // '3d' | 'coronal' | 'sagittal' | 'axial'
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);

  const controlsRef = useRef(null);

  const activeModel = BONE_MODELS.find((m) => m.id === selectedModelId) || BONE_MODELS[0];

  const { selectedRegion, regionData, selectRegion } = useRegionalAnalysis(
    effectivePatientId,
    activeModel.regionKey || regionKeys[0] || 'proximal-femur'
  );

  const handleModelSelect = useCallback((modelId) => {
    setSelectedModelId(modelId);
    setViewerKey((k) => k + 1);
  }, []);

  const handleReset = useCallback(() => {
    setViewAngle('3d');
    setViewerKey((k) => k + 1);
  }, []);

  if (!regionData) {
    return (
      <div className="p-10 text-center text-slate-500 flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        <span>Loading 3D planning data…</span>
      </div>
    );
  }

  const statusColor = {
    high: {
      card: 'bg-red-50/80 border-red-200 ring-red-200',
      text: 'text-red-700',
      chip: 'bg-red-100 text-red-700 ring-red-200',
      dot: 'bg-red-600',
      value: 'text-red-600',
    },
    moderate: {
      card: 'bg-amber-50/80 border-amber-200 ring-amber-200',
      text: 'text-amber-700',
      chip: 'bg-amber-100 text-amber-700 ring-amber-200',
      dot: 'bg-amber-500',
      value: 'text-amber-600',
    },
    low: {
      card: 'bg-teal-50/80 border-teal-200 ring-teal-200',
      text: 'text-teal-700',
      chip: 'bg-teal-100 text-teal-700 ring-teal-200',
      dot: 'bg-teal-500',
      value: 'text-teal-600',
    },
  }[regionData.riskLevel || 'moderate'];

  return (
    <div className="space-y-5">
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">3D Anatomical Planning</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 text-blue-800">
              Interactive GLB
            </span>
          </div>
          <p className="text-slate-600 mt-1 text-sm">
            High-fidelity 3D bone models with auto-normalization, multi-plane slicing, and metabolic risk overlays.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200/80 rounded-xl text-emerald-700 font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            3D WebGL Engine Active
          </span>
        </div>
      </div>

      {/* ── Model Selection Strip ───────────────────────────────── */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 px-4 py-3 shadow-xl">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-700">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider whitespace-nowrap pl-1">
            <Bone size={14} className="text-blue-400" />
            <span>Select Model:</span>
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
                  Risk Heatmap
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
              style={{ height: isFullscreen ? 'calc(100vh - 120px)' : '560px' }}
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
                  <span>Left Click: Rotate · Scroll: Zoom · Right Click: Pan</span>
                </div>
              </div>

              {/* Active Model Indicator Tag */}
              <div className="absolute top-4 right-4 z-10 px-3 py-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/80 text-xs text-slate-200 font-bold flex items-center gap-2 shadow-lg">
                <Eye size={13} className="text-blue-400" />
                <span>{activeModel.label}</span>
                <span className="text-slate-500 font-normal">| {activeModel.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Analysis Panel */}
        {!isFullscreen && (
          <div className="space-y-5">
            {/* Region Analysis Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-base font-extrabold text-slate-900 mb-3">Region Analysis</h3>
              <p className="text-xs text-slate-500 font-medium mb-1.5">
                Selected Anatomical ROI:
              </p>
              <select
                value={selectedRegion}
                onChange={(e) => selectRegion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
              >
                {regionKeys.map((k) => (
                  <option key={k} value={k}>
                    {regions[k]?.location || k}
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-xs font-semibold py-1.5 border-t border-slate-100">
                <span className="text-slate-500">Target Anatomy:</span>
                <span className="text-blue-700 font-bold">{regionData.anatomy}</span>
              </div>
            </div>

            {/* AI Observation Card */}
            <div className={`rounded-2xl border-2 p-5 shadow-sm ${statusColor.card} ring-1`}>
              <div className="flex items-start gap-3 mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center ring-1 ring-slate-200 shrink-0">
                  <Activity size={16} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">AI Diagnostic Insight</h4>
                  <p className="text-[11px] font-bold text-slate-500">Volumetric Bone Density Risk</p>
                </div>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{regionData.observation}</p>
              <button className="text-blue-700 text-xs font-bold mt-2.5 hover:underline inline-flex items-center gap-1">
                Full Quantitative Report <ChevronRight size={12} />
              </button>
            </div>

            {/* Volumetric Metrics */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <h4 className="text-sm font-extrabold text-slate-900 mb-3">Volumetric Metrics</h4>
              <div className="space-y-3">
                {Object.entries(regionData.metrics || {}).map(([k, v]) => {
                  const key = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
                  const isEstimated = k.toLowerCase().includes('strength') && regionData.riskLevel === 'high';
                  return (
                    <div key={k} className="pb-2.5 border-b border-slate-100 last:border-0 last:pb-0 flex items-center justify-between">
                      <p className="text-xs text-slate-500 font-semibold">{key}</p>
                      <p className={`text-sm font-black ${isEstimated ? statusColor.value : 'text-slate-900'}`}>{v}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Regional Status */}
            <div className={`rounded-2xl border-2 p-4 ring-1 ${statusColor.card}`}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className={statusColor.text} />
                <p className={`text-xs font-black ${statusColor.text}`}>
                  Status: {regionData.status}
                </p>
              </div>
              <p className={`text-[11px] font-semibold mt-1.5 ${statusColor.text} opacity-90`}>
                {regionData.comparisonToPrevious}
              </p>
            </div>

            {/* Action CTA */}
            <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
              <FileDown size={15} />
              Export 3D Surgical ROI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
