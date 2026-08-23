import { useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Maximize2, Minimize2, RotateCw, Activity, AlertTriangle,
  FileDown, Layers, Bone, Eye, ChevronRight, Play, Pause,
  Sparkles, FlaskConical, Edit3, ArrowUpRight, TrendingUp,
  TrendingDown, Minus, Brain, Crosshair, CheckCircle2,
  Sliders, ShieldAlert, Cpu, Trash2, Box, Info
} from 'lucide-react';
import { usePatientContext } from '../../../context/PatientDataContext';
import BoneModelViewer from './BoneModelViewer';

const BONE_MODELS = [
  { id: 'femur', label: 'Femur', emoji: '🦵', category: 'Lower Limb', note: 'Femoral head, neck, trochanter & shaft' },
];

const BIOMARKER_INPUTS = [
  { key: 'pth',       label: 'PTH',        fullLabel: 'Parathyroid Hormone', unit: 'pg/mL', ref: '15–65',    step: 1 },
  { key: 'vitaminD',  label: 'Vitamin D',  fullLabel: '25-OH Vitamin D',     unit: 'ng/mL', ref: '30–100',   step: 1 },
  { key: 'calcium',   label: 'Calcium',    fullLabel: 'Serum Calcium',       unit: 'mg/dL', ref: '8.6–10.3', step: 0.1 },
  { key: 'phosphate', label: 'Phosphate',  fullLabel: 'Inorganic Phosphate', unit: 'mg/dL', ref: '2.5–4.5',  step: 0.1 },
  { key: 'alp',       label: 'ALP',        fullLabel: 'Alkaline Phosphatase',unit: 'U/L',   ref: '44–147',   step: 1 },
  { key: 'ctx',       label: 'CTX-I',      fullLabel: 'Bone Resorption',     unit: 'pg/mL', ref: '< 300',    step: 10 },
];

const RISK_STYLE = {
  high:     { dot: 'bg-red-500',   badge: 'bg-red-50 text-red-700 border-red-200',     text: 'text-red-600',   banner: 'border-red-200 bg-red-50/60',     icon: 'text-red-500' },
  moderate: { dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200', text: 'text-amber-600', banner: 'border-amber-200 bg-amber-50/60', icon: 'text-amber-500' },
  low:      { dot: 'bg-teal-400',  badge: 'bg-teal-50 text-teal-700 border-teal-200',   text: 'text-teal-600',  banner: 'border-teal-200 bg-teal-50/60',   icon: 'text-teal-500' },
};

function trendIcon(direction) {
  if (direction === 'up')   return <TrendingUp   size={11} className="text-red-500" />;
  if (direction === 'down') return <TrendingDown size={11} className="text-amber-500" />;
  return <Minus size={11} className="text-teal-500" />;
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

  const [selectedModelId, setSelectedModelId] = useState('femur');
  const [renderMode, setRenderMode] = useState('heatmap');
  const [viewAngle, setViewAngle] = useState('overview');
  const [xrayOn, setXrayOn] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('anatomy');

  const activeModel = BONE_MODELS.find((m) => m.id === selectedModelId) ?? BONE_MODELS[0];
  const effectiveRiskLevel = backendRiskLevel ?? regionalData?.riskLevel ?? 'high';
  const rs = RISK_STYLE[effectiveRiskLevel] ?? RISK_STYLE.high;

  const currentRoiNote = roiNotes?.[selectedRegion] ?? '';

  const zoneList = [
    { id: 'proximal-femur', label: 'Proximal Femur', risk: 'HIGH', color: 'bg-red-500', text: 'text-red-600', badge: 'bg-red-50 text-red-700 border-red-200' },
    { id: 'vertebral-body', label: 'Vertebral Body (L4-L5)', risk: 'MODERATE', color: 'bg-amber-400', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    { id: 'acetabulum', label: 'Acetabulum', risk: 'NORMAL', color: 'bg-teal-400', text: 'text-teal-600', badge: 'bg-teal-50 text-teal-700 border-teal-200' },
  ];

  return (
    <div className="space-y-4">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              3D Surgical Planning
            </h2>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black ${rs.badge}`}>
              <span className={`w-2 h-2 rounded-full ${rs.dot} animate-pulse`} />
              {effectiveRiskLevel === 'high' ? 'High Risk Active' : 'Normal Profile'}
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            <span className="text-red-600 font-bold">1 critical zone</span> • <span className="text-amber-600 font-bold">1 elevated</span> • Click or hover any zone for the AI clinical HUD
          </p>
        </div>

        <button
          onClick={() => navigate(`/patients/${effectivePatientId}/assessment`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/25 transition cursor-pointer"
        >
          <Brain size={14} />
          Full AI Assessment
          <ArrowUpRight size={13} />
        </button>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* ── Left / Main 3D Viewport Column (3 cols) ────────────────── */}
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4' : 'lg:col-span-3'} flex flex-col gap-3`}>

          {/* Anatomy selector strip */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 pr-3 border-r border-slate-700">
                <Bone size={14} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  Anatomy
                </span>
              </div>
              <button
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-md shadow-blue-600/30"
              >
                <span>🦵</span>
                <span>Femur</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Femoral head, neck, trochanter & shaft
            </span>
          </div>

          {/* Viewer Card */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col flex-1 min-h-[560px]">
            {/* Toolbar */}
            <div className="px-4 py-2.5 bg-[#0a0f1e] border-b border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-0.5 bg-slate-900/60 rounded-xl border border-slate-800">
                {[
                  { id: 'anatomical', label: 'Anatomical', activeClass: 'bg-slate-700 text-slate-100' },
                  { id: 'heatmap', label: 'Risk Heatmap', activeClass: 'bg-orange-600 text-white shadow-md shadow-orange-600/30' },
                  { id: 'xray', label: 'X-Ray', activeClass: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' },
                  { id: 'wireframe', label: 'Wireframe', activeClass: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' },
                  { id: 'mesh', label: 'Mesh', activeClass: 'bg-teal-600 text-white shadow-md shadow-teal-600/30' },
                ].map((btn) => (
                  <button
                    key={btn.id}
                    onClick={() => {
                      setRenderMode(btn.id);
                      setXrayOn(btn.id === 'xray');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      renderMode === btn.id
                        ? btn.activeClass
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-bold text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>1 critical</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>1 elevated</span>
                </div>
                <button
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`p-1.5 rounded-lg border transition ${
                    autoRotate ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                  title="Auto Rotate"
                >
                  <RotateCw size={14} />
                </button>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
            </div>

            {/* 3D Canvas rendering the glowing Trabecular Bone */}
            <div className="flex-1 relative">
              <BoneModelViewer
                viewAngle={viewAngle}
                heatmap={renderMode === 'heatmap'}
                wireframe={renderMode === 'wireframe'}
                meshMode={renderMode === 'mesh'}
                xray={renderMode === 'xray'}
                autoRotate={autoRotate}
                selectedRegion={selectedRegion}
                onSelectRegion={setSelectedRegion}
                onViewAngleChange={setViewAngle}
                onXrayChange={(x) => {
                  setXrayOn(x);
                  if (x) setRenderMode('xray');
                  else if (renderMode === 'xray') setRenderMode('heatmap');
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Right Clinical Sidebar (1 col) ────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-100">
              <button
                onClick={() => setSidebarTab('anatomy')}
                className={`flex-1 py-3 px-4 text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === 'anatomy'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Bone size={14} />
                Anatomy
              </button>
              <button
                onClick={() => setSidebarTab('biomarkers')}
                className={`flex-1 py-3 px-4 text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  sidebarTab === 'biomarkers'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <FlaskConical size={14} />
                Biomarkers
              </button>
            </div>

            <div className="p-5 space-y-5">
              {sidebarTab === 'anatomy' ? (
                <>
                  {/* ZONE RISK INDEX */}
                  <div className="space-y-2.5">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      ZONE RISK INDEX
                    </p>
                    <div className="space-y-2">
                      {zoneList.map((z) => {
                        const isSelected = selectedRegion === z.id;
                        return (
                          <div
                            key={z.id}
                            onClick={() => setSelectedRegion(z.id)}
                            className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-slate-50 border-blue-500 ring-1 ring-blue-500/30'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2.5 h-2.5 rounded-full ${z.color}`} />
                              <span className="text-xs font-bold text-slate-800">{z.label}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${z.badge}`}>
                              {z.risk}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* REGION OF INTEREST */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        REGION OF INTEREST
                      </p>
                      <span className="text-[10px] font-bold text-blue-600">Click Model</span>
                    </div>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="proximal-femur">proximal-femur</option>
                      <option value="femoral-neck">femoral-neck</option>
                      <option value="greater-trochanter">greater-trochanter</option>
                      <option value="shaft">shaft</option>
                    </select>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Anatomy: <span className="text-blue-700 font-semibold">Femoral neck and intertrochanteric region</span>
                    </p>
                  </div>

                  {/* STRUCTURAL METRICS */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      STRUCTURAL METRICS
                    </p>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Trabecular vBMD</span>
                        <span className="font-bold text-slate-900">112.4 mg/cm³</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Cortical vBMD</span>
                        <span className="font-bold text-slate-900">845.1 mg/cm³</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Estimated Strength</span>
                        <span className="font-bold text-slate-900">5,400 N (Optimal)</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Cortical Thickness</span>
                        <span className="font-bold text-slate-900">3.0 mm</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-500 font-medium">Trabecular Pattern</span>
                        <span className="font-bold text-slate-900">Irregular</span>
                      </div>
                    </div>
                  </div>

                  {/* PLANNING NOTES */}
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        PLANNING NOTES
                      </p>
                      <span className="text-[10px] text-slate-400">Auto-saved</span>
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
                </>
              ) : (
                /* BIOMARKERS TAB */
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    SYNCHRONIZED LAB PANEL
                  </p>
                  {BIOMARKER_INPUTS.map((item) => {
                    const b = biomarkers?.[item.key] || {};
                    return (
                      <div key={item.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-700">{item.fullLabel}</span>
                          <span className="font-black text-slate-900 font-mono">
                            {b.value ?? '—'} <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span>
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Ref: {item.ref}</span>
                          <span className={`font-bold uppercase ${b.status === 'elevated' ? 'text-red-600' : b.status === 'low' ? 'text-amber-600' : 'text-teal-600'}`}>
                            {b.status || 'NORMAL'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
