import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Maximize2, Minimize2, RotateCw, Activity, AlertTriangle,
  FileDown, Layers, Bone, Eye, ChevronRight, Play, Pause,
  Sparkles, FlaskConical, Edit3, ArrowUpRight, TrendingUp,
  TrendingDown, Minus, Brain, Crosshair, CheckCircle2,
  Sliders, ShieldAlert, Cpu, Trash2, Box, Info
} from 'lucide-react';
import { usePatientContext } from '../../../context/PatientDataContext';
import { apiService } from '../../../services/api';
import BoneModelViewer from './BoneModelViewer';

const BONE_MODELS = [
  { id:'femur', label:'Femur', emoji:'🦵', path:'/storage/bones/femur.glb', category:'Lower Limb', note:'Femoral head, neck, trochanter & shaft' },
];

const RISK_STYLE = {
  high:     { dot:'bg-red-500',   badge:'bg-red-50 text-red-700 border-red-200',     text:'text-red-600',   banner:'border-red-200 bg-red-50/60',     icon:'text-red-500' },
  moderate: { dot:'bg-amber-400', badge:'bg-amber-50 text-amber-700 border-amber-200', text:'text-amber-600', banner:'border-amber-200 bg-amber-50/60', icon:'text-amber-500' },
  low:      { dot:'bg-teal-400',  badge:'bg-teal-50 text-teal-700 border-teal-200',   text:'text-teal-600',  banner:'border-teal-200 bg-teal-50/60',   icon:'text-teal-500' },
};

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

export default function Planning3DView({ patientId }) {
  const params = useParams();
  const navigate = useNavigate();
  const effectivePatientId = patientId || params.patientId || 'PEB-8842-A';

  const {
    biomarkers, updateBiomarker,
    selectedRegion, setSelectedRegion,
    roiNotes, updateRoiNote, persistRoiNote,
    regionalData, assessment, regionalAnalysisDB,
    backendRiskLevel,
  } = usePatientContext();

  // Workflow Progression Phase: 'highlight' | 'biomarkers' | 'simulation'
  const [phase, setPhase] = useState('highlight');

  // Phase 1 States: Region Highlight & 3D ROI Capture
  const [isHighlightActive, setIsHighlightActive] = useState(true);
  const [selectedHighlightZone, setSelectedHighlightZone] = useState('femoral-neck');
  const [roiList, setRoiList] = useState([]);
  const [isRoiModeActive, setIsRoiModeActive] = useState(false);
  const [activeBiomarkerFocus, setActiveBiomarkerFocus] = useState(null);

  // Phase 3 States: Fixation Simulation
  const [activePlan, setActivePlan] = useState('A');
  const [isPlayingSimulation, setIsPlayingSimulation] = useState(false);
  const [stitchTension, setStitchTension] = useState(65);

  // Viewer Controls
  const [selectedModelId, setSelectedModelId] = useState('femur');
  const [renderMode, setRenderMode] = useState('heatmap');
  const [viewAngle, setViewAngle] = useState('overview');
  const [xrayOn, setXrayOn] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const controlsRef = useRef(null);
  const activeModel = BONE_MODELS.find(m => m.id === selectedModelId) ?? BONE_MODELS[0];

  const zoneRisks = useMemo(
    () => buildZoneRisks(effectivePatientId, regionalAnalysisDB, regionalData, assessment),
    [effectivePatientId, regionalAnalysisDB, regionalData, assessment],
  );

  const effectiveRiskLevel = backendRiskLevel ?? regionalData?.riskLevel ?? 'high';
  const rs = RISK_STYLE[effectiveRiskLevel] ?? RISK_STYLE.high;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Fetch Database ROIs on load
  useEffect(() => {
    const loadRois = async () => {
      try {
        const rois = await apiService.getROIs(effectivePatientId);
        setRoiList(rois);
      } catch (e) {
        console.warn("Using default ROIs:", e);
      }
    };
    loadRois();
  }, [effectivePatientId]);

  // Click on 3D Mesh to extract coordinates and persist ROI
  const handleBoneMeshClick = useCallback(async ({ point, zone }) => {
    if (!isRoiModeActive && phase !== 'highlight') return;

    const coords = {
      x: Number((point[0] * 100).toFixed(2)),
      y: Number((point[1] * 100).toFixed(2)),
      z: Number((point[2] * 100).toFixed(2)),
    };

    const newRoiPayload = {
      region_name: zone?.label || 'Target Surgical Zone',
      coordinates: coords,
      cortical_thickness_mm: 1.8,
      trabecular_v_bmd: 112.5,
      risk_level: effectiveRiskLevel,
    };

    try {
      const created = await apiService.createROI(effectivePatientId, newRoiPayload);
      setRoiList((prev) => [...prev, created]);
      showToast(`ROI coordinate [${coords.x}, ${coords.y}, ${coords.z}] captured & saved.`);
    } catch (e) {
      setRoiList((prev) => [...prev, { ...newRoiPayload, id: `local-${Date.now()}` }]);
      showToast(`ROI coordinate captured.`);
    }
  }, [effectivePatientId, effectiveRiskLevel, isRoiModeActive, phase]);

  // Delete ROI from database
  const handleDeleteRoi = async (roiId) => {
    try {
      await apiService.deleteROI(effectivePatientId, roiId);
      setRoiList((prev) => prev.filter((r) => r.id !== roiId && r._id !== roiId));
      showToast('ROI deleted from database.');
    } catch (e) {
      setRoiList((prev) => prev.filter((r) => r.id !== roiId && r._id !== roiId));
    }
  };

  return (
    <div className="space-y-4 h-full select-none text-slate-100">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-cyan-500/40 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 text-sm font-semibold">
          <CheckCircle2 size={18} className="text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Overview Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              EndoBone 3D Volumetric Planning & Simulation
            </h2>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black ${rs.badge}`}>
              <span className={`w-2 h-2 rounded-full ${rs.dot} animate-pulse`} />
              {effectiveRiskLevel.toUpperCase()} RISK PROFILE
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            3-Phase biomarker-informed surgical planning, fracture ROI contouring, and mechanical fixation simulation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/patients/${effectivePatientId}/assessment`)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition border border-slate-300 cursor-pointer"
          >
            <Brain size={14} className="text-blue-600" />
            AI Assessment
          </button>
          <button
            onClick={() => navigate(`/patients/${effectivePatientId}/summary`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/25 transition cursor-pointer"
          >
            <FileDown size={14} />
            Pre-Surgical Deliverable
          </button>
        </div>
      </div>

      {/* Main 3D Canvas + Side Control Modules */}
      <div className="grid lg:grid-cols-12 gap-4">

        {/* ── LEFT CONTROL PANEL (Phase 1 or Phase 2) ────────────────── */}
        <div className="lg:col-span-4 space-y-4">

          {/* Phase 1 Panel: Region Highlight & ROI Selector */}
          {phase === 'highlight' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    PHASE 1: REGION HIGHLIGHT
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  ANATOMY MESH
                </span>
              </div>

              {/* Select Region Toggle & Dropdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">SELECT REGION</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-400">
                    <span>{isHighlightActive ? 'Active' : 'Inactive'}</span>
                    <input
                      type="checkbox"
                      checked={isHighlightActive}
                      onChange={(e) => setIsHighlightActive(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-9 h-5 rounded-full transition p-0.5 ${isHighlightActive ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition transform ${isHighlightActive ? 'translate-x-4' : ''}`} />
                    </div>
                  </label>
                </div>

                <select
                  value={selectedHighlightZone}
                  onChange={(e) => {
                    setSelectedHighlightZone(e.target.value);
                    setSelectedRegion(e.target.value);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="femoral-neck">Highlighted (Femoral Neck Fracture)</option>
                  <option value="greater-trochanter">Greater Trochanter</option>
                  <option value="shaft">Femoral Diaphysis / Shaft</option>
                  <option value="custom">Custom ROI Area</option>
                </select>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsRoiModeActive(!isRoiModeActive);
                      showToast(isRoiModeActive ? 'ROI Mode Deactivated' : 'Click on 3D bone to place ROI point');
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                      isRoiModeActive
                        ? 'bg-red-500/20 border-red-500 text-red-300 ring-2 ring-red-500/30'
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Crosshair size={14} className={isRoiModeActive ? 'animate-spin' : ''} />
                    {isRoiModeActive ? 'ROI Mode Active' : 'Capture 3D ROI'}
                  </button>
                  <button
                    onClick={() => setAutoRotate(!autoRotate)}
                    className="py-2 px-3 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 transition"
                    title="Toggle Auto Rotate"
                  >
                    <RotateCw size={14} className={autoRotate ? 'animate-spin text-cyan-400' : ''} />
                  </button>
                </div>
              </div>

              {/* Saved ROIs List */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Extracted Case ROIs ({roiList.length})
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {roiList.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic py-2">
                      No custom ROI coordinates placed. Click &apos;Capture 3D ROI&apos; and click any bone surface.
                    </p>
                  ) : (
                    roiList.map((r, i) => (
                      <div key={r.id || r._id || i} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-slate-200">{r.region_name || `ROI #${i + 1}`}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Coords: [{r.coordinates?.x ?? 0}, {r.coordinates?.y ?? 0}, {r.coordinates?.z ?? 0}]
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteRoi(r.id || r._id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Phase 2 Panel: Biomarker-Informed Analysis */}
          {phase === 'biomarkers' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    PHASE 2: BIOMARKER-INFORMED ANALYSIS
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                  ENDOCRINE PROFILE
                </span>
              </div>

              {/* Endocrine Biomarker Bars */}
              <div className="space-y-4">
                {/* Vitamin D Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">Vitamin D (25-OH)</span>
                    <span className="text-red-400 font-black">30% low ⚠</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-red-500 to-amber-500 rounded-full" style={{ width: '38%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0</span>
                    <span>10</span>
                    <span>20</span>
                    <span>30</span>
                  </div>
                </div>

                {/* PTH Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">Parathyroid Hormone (PTH)</span>
                    <span className="text-amber-400 font-black">Elevated ⚠</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full" style={{ width: '85%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>10</span>
                    <span>25</span>
                    <span>40</span>
                    <span>65+</span>
                  </div>
                </div>

                {/* Bone-Specific ALP Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-300">Bone-Specific ALP</span>
                    <span className="text-emerald-400 font-black">Normal</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden relative">
                    <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0</span>
                    <span>30</span>
                    <span>60</span>
                  </div>
                </div>
              </div>

              {/* Analysis Text Box */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                <p className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                  CLINICAL SYNTHESIS
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  ANALYSIS: Fracture site context indicates systemic low bone density and high resorption rate, requiring optimized internal fixation strategy and osteobiologic infill.
                </p>
              </div>
            </div>
          )}

          {/* Phase 3 Panel: Pre-Surgical Planning Simulation */}
          {phase === 'simulation' && (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                    PHASE 3: PRE-SURGICAL SIMULATION
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                  BIOMECHANICS
                </span>
              </div>

              {/* Plan Switcher */}
              <div className="space-y-2">
                <p className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  PRE-SURGICAL FIXATION PLAN
                </p>
                <div className="space-y-2">
                  <label
                    onClick={() => setActivePlan('A')}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition text-xs ${
                      activePlan === 'A'
                        ? 'bg-cyan-950/50 border-cyan-500/60 ring-1 ring-cyan-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fixationPlan"
                      checked={activePlan === 'A'}
                      onChange={() => setActivePlan('A')}
                      className="mt-0.5 text-cyan-500"
                    />
                    <div>
                      <p className="font-bold">Plan A: Wire-Stitch Fixation & Ortho-Biologic Infill</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">High resistance against resorption pull</p>
                    </div>
                  </label>

                  <label
                    onClick={() => setActivePlan('B')}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition text-xs ${
                      activePlan === 'B'
                        ? 'bg-cyan-950/50 border-cyan-500/60 ring-1 ring-cyan-500/40 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="fixationPlan"
                      checked={activePlan === 'B'}
                      onChange={() => setActivePlan('B')}
                      className="mt-0.5 text-cyan-500"
                    />
                    <div>
                      <p className="font-bold">Plan B: Cannulated Lag Screws & Lateral Plate</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Direct mechanical stabilization</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Stitch Tension Slider */}
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">Adjust Stitch Tension</span>
                  <span className="text-cyan-400 font-mono">{stitchTension}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={stitchTension}
                  onChange={(e) => setStitchTension(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>

              {/* Simulation Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setIsPlayingSimulation(!isPlayingSimulation)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-black shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {isPlayingSimulation ? <Pause size={15} /> : <Play size={15} />}
                  {isPlayingSimulation ? 'PAUSE SIMULATION' : 'PLAY SIMULATION (4200 N LOAD)'}
                </button>

                <button
                  onClick={async () => {
                    try {
                      await apiService.createSimulation(effectivePatientId, {
                        simulation_type: `Mechanical Fixation ${activePlan}`,
                        yield_load_n: 4200,
                        stiffness_n_mm: 860,
                        fracture_risk_score: 0.28,
                      });
                      showToast('Simulation configuration registered with backend.');
                    } catch (e) {
                      showToast('Simulation configuration active.');
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Cpu size={14} />
                  SELECT SIMULATION
                </button>
              </div>
            </div>
          )}

          {/* Quick Scan Summary Box */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-2">
            <p className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
              SCAN ANALYSIS
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400">Osteopenia (T-Score: -2.3)</span>
              <span className="font-bold text-slate-400">Hip Risk: <strong className="text-red-400">Moderate (9.4%)</strong></span>
            </div>
          </div>
        </div>

        {/* ── CENTER / RIGHT 3D VIEWPORT CANVAS ──────────────────────── */}
        <div className="lg:col-span-8 bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl relative min-h-[560px] flex flex-col">
          
          {/* Top 3D Viewport Action Bar */}
          <div className="px-5 py-3 bg-[#0a0f1e]/90 border-b border-slate-800/80 flex items-center justify-between gap-3 z-10">
            <div className="flex items-center gap-2">
              <Bone size={16} className="text-cyan-400" />
              <span className="text-xs font-black text-slate-200 uppercase tracking-widest">
                3D Volumetric Model: {activeModel.label}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setRenderMode(renderMode === 'heatmap' ? 'anatomical' : 'heatmap')}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                  renderMode === 'heatmap'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Density Map
              </button>
              <button
                onClick={() => setAutoRotate(!autoRotate)}
                className={`p-1.5 rounded-lg border transition ${
                  autoRotate ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
                title="Auto Rotate"
              >
                <RotateCw size={14} />
              </button>
            </div>
          </div>

          {/* Canvas 3D Viewer */}
          <div className="flex-1 relative">
            <BoneModelViewer
              modelPath={activeModel.path}
              modelLabel={activeModel.label}
              viewAngle={viewAngle}
              heatmap={renderMode === 'heatmap'}
              wireframe={renderMode === 'wireframe'}
              xray={renderMode === 'xray'}
              autoRotate={autoRotate}
              riskLevel={effectiveRiskLevel}
              selectedRegion={selectedRegion}
              clinicalNote={assessment?.clinicalNotes || ''}
              zoneRisks={zoneRisks}
              onSelectRegion={setSelectedRegion}
              phase={phase}
              isHighlightActive={isHighlightActive}
              biomarkers={biomarkers}
              onBiomarkerClick={(b) => setActiveBiomarkerFocus(b)}
              activePlan={activePlan}
              isPlayingSimulation={isPlayingSimulation}
              stitchTension={stitchTension}
              roiMarkers={roiList}
              onBoneMeshClick={handleBoneMeshClick}
            />
          </div>
        </div>
      </div>

      {/* ── BOTTOM WORKFLOW PROGRESSION BAR (Exact match to Screenshot 2) ─── */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-3 shadow-xl flex items-center justify-between gap-2 overflow-x-auto">
        <button
          onClick={() => setPhase('highlight')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
            phase === 'highlight'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-lg shadow-teal-500/25 border border-teal-400'
              : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>[ HIGHLIGHTING REGION ]</span>
          {phase === 'highlight' && <ChevronRight size={14} className="text-white" />}
        </button>

        <button
          onClick={() => setPhase('biomarkers')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
            phase === 'biomarkers'
              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-400'
              : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>[ BIOMARKER ANALYSIS ]</span>
          {phase === 'biomarkers' && <ChevronRight size={14} className="text-white" />}
        </button>

        <button
          onClick={() => setPhase('simulation')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer ${
            phase === 'simulation'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-500 text-white shadow-lg shadow-purple-500/25 border border-purple-400'
              : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <span>[ PRE-SURGICAL PLANNING SIMULATION ]</span>
          {phase === 'simulation' && <ChevronRight size={14} className="text-white" />}
        </button>
      </div>
    </div>
  );
}
