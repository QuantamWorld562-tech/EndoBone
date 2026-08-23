import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Maximize2, Minimize2, RotateCw, Bone, FlaskConical,
  ArrowUpRight, Brain, Activity, AlertTriangle, CheckCircle,
  MapPin, TrendingDown, TrendingUp, FileText, Crosshair, Info
} from 'lucide-react';
import { usePatientContext } from '../../../context/PatientDataContext';
import BoneModelViewer from './BoneModelViewer';

const BIOMARKER_INPUTS = [
  { key: 'pth',       fullLabel: 'Parathyroid Hormone', unit: 'pg/mL', ref: '15–65',    step: 1 },
  { key: 'vitaminD',  fullLabel: '25-OH Vitamin D',     unit: 'ng/mL', ref: '30–100',   step: 1 },
  { key: 'calcium',   fullLabel: 'Serum Calcium',       unit: 'mg/dL', ref: '8.6–10.3', step: 0.1 },
  { key: 'phosphate', fullLabel: 'Inorganic Phosphate', unit: 'mg/dL', ref: '2.5–4.5',  step: 0.1 },
  { key: 'alp',       fullLabel: 'Alkaline Phosphatase',unit: 'U/L',   ref: '44–147',   step: 1 },
  { key: 'ctx',       fullLabel: 'Bone Resorption',     unit: 'pg/mL', ref: '< 300',    step: 10 },
];

const RISK_CFG = {
  high:     { label: 'HIGH RISK',  dot: 'bg-red-500',    accent: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    badge: 'bg-red-100 text-red-700 border-red-200', bar: 'bg-red-500',    icon: AlertTriangle },
  moderate: { label: 'MODERATE',   dot: 'bg-orange-500', accent: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700 border-orange-200', bar: 'bg-orange-500', icon: TrendingDown },
  low:      { label: 'NORMAL',     dot: 'bg-teal-500',   accent: 'text-teal-600',   bg: 'bg-teal-50',   border: 'border-teal-200',   badge: 'bg-teal-100 text-teal-700 border-teal-200', bar: 'bg-teal-500',   icon: CheckCircle },
};

const STATIC_ZONES = [
  { id: 'femoral-neck',       label: 'Femoral Neck',             riskLevel: 'high',     tScore: '-2.3', vBMD: '112.4', note: 'Critical mechanical stress and osteopenic resorption. High fracture risk at intertrochanteric junction.' },
  { id: 'greater-trochanter', label: 'Greater Trochanter',       riskLevel: 'moderate', tScore: '-1.9', vBMD: '198.6', note: 'Moderate cortical thinning at trochanteric insertion. Bone turnover markers elevated.' },
  { id: 'shaft',              label: 'Femoral Shaft',            riskLevel: 'low',      tScore: '-0.5', vBMD: '845.1', note: 'Cortical bone density and thickness within normal biomechanical tolerance.' },
];

function ZoneInspectionPanel({ zone, onClose }) {
  if (!zone) return null;
  const cfg = RISK_CFG[zone.riskLevel] || RISK_CFG.low;
  const Icon = cfg.icon;
  const riskPct = zone.riskLevel === 'high' ? 87 : zone.riskLevel === 'moderate' ? 52 : 12;

  return (
    <div className={`rounded-2xl border ${cfg.border} ${cfg.bg} overflow-hidden animate-fade-in`}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-white/70 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MapPin size={13} className={cfg.accent} />
          <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Active Zone</span>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${cfg.badge} flex items-center gap-1`}>
          <Icon size={9} />
          {cfg.label}
        </span>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-black text-slate-900">{zone.label}</h3>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">Anatomical Region • BMD Analysis</p>
        </div>

        {/* T-Score & vBMD row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white/80 rounded-xl p-3 border border-white/80 text-center">
            <div className={`text-lg font-black font-mono leading-none ${cfg.accent}`}>{zone.tScore}</div>
            <div className="text-[10px] text-slate-500 font-bold mt-0.5">T-Score</div>
          </div>
          <div className="bg-white/80 rounded-xl p-3 border border-white/80 text-center">
            <div className="text-lg font-black font-mono leading-none text-slate-800">{zone.vBMD}</div>
            <div className="text-[10px] text-slate-500 font-bold mt-0.5">vBMD mg/cm³</div>
          </div>
        </div>

        {/* Risk level bar */}
        <div>
          <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
            <span>Fracture Risk Index</span>
            <span className={cfg.accent}>{riskPct}%</span>
          </div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${cfg.bar}`} style={{ width: `${riskPct}%` }} />
          </div>
        </div>

        {/* Clinical observation */}
        <div className="bg-white/70 rounded-xl p-3 border border-slate-100">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Info size={11} className="text-slate-400" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">Clinical Observation</span>
          </div>
          <p className="text-[11px] text-slate-700 font-medium leading-relaxed">{zone.note}</p>
        </div>
      </div>
    </div>
  );
}

export default function Planning3DView({ patientId }) {
  const params = useParams();
  const navigate = useNavigate();
  const effectivePatientId = patientId || params.patientId || 'PEB-8842-A';

  const {
    biomarkers,
    selectedRegion, setSelectedRegion,
    roiNotes, updateRoiNote, persistRoiNote,
    regionalData, backendRiskLevel,
  } = usePatientContext();

  const [renderMode, setRenderMode] = useState('heatmap');
  const [viewAngle, setViewAngle] = useState('overview');
  const [xrayOn, setXrayOn] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('anatomy');
  const [hoveredZone, setHoveredZone] = useState(null);

  // Active zone = hovered or selected
  const activeZone = useMemo(() => {
    const id = hoveredZone?.id || selectedRegion;
    return STATIC_ZONES.find(z => z.id === id) || STATIC_ZONES[0];
  }, [hoveredZone, selectedRegion]);

  const effectiveRiskLevel = backendRiskLevel ?? regionalData?.riskLevel ?? 'high';
  const rs = RISK_CFG[effectiveRiskLevel] ?? RISK_CFG.high;
  const currentRoiNote = roiNotes?.[selectedRegion] ?? '';

  return (
    <div className="space-y-4">
      {/* ── Page Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">3D Surgical Planning</h2>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-black ${rs.badge}`}>
              <span className={`w-2 h-2 rounded-full ${rs.dot} animate-pulse`} />
              {effectiveRiskLevel === 'high' ? 'High Risk Active' : 'Normal Profile'}
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            <span className="text-red-600 font-bold">1 critical zone</span> · <span className="text-orange-600 font-bold">1 elevated</span> · Hover or click any zone on the 3D model to inspect
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(`/patients/${effectivePatientId}/assessment`)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-200"
          >
            <Brain size={14} />
            AI Assessment
          </button>
          <button
            onClick={() => navigate(`/patients/${effectivePatientId}/summary`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/25 transition cursor-pointer"
          >
            <FileText size={14} />
            Pre-Surgery Summary
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* ── 3D Viewport ── */}
        <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-4' : 'lg:col-span-3'} flex flex-col gap-3`}>
          {/* Anatomy strip */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 px-3 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 pr-3 border-r border-slate-700">
                <Bone size={14} className="text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anatomy</span>
              </div>
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-md shadow-blue-600/30">
                <span>🦵</span><span>Femur</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">Femoral head, neck, trochanter &amp; shaft</span>
          </div>

          {/* Viewer card */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col flex-1 min-h-[560px]">
            {/* Toolbar */}
            <div className="px-4 py-2.5 bg-[#0a0f1e] border-b border-slate-800/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-0.5 bg-slate-900/60 rounded-xl border border-slate-800">
                {[
                  { id: 'anatomical', label: 'Anatomical',  ac: 'bg-slate-700 text-slate-100' },
                  { id: 'heatmap',    label: 'Risk Heatmap',ac: 'bg-orange-600 text-white shadow-md shadow-orange-600/30' },
                  { id: 'xray',       label: 'X-Ray',       ac: 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30' },
                  { id: 'wireframe',  label: 'Wireframe',   ac: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' },
                  { id: 'mesh',       label: 'Mesh',        ac: 'bg-teal-600 text-white shadow-md shadow-teal-600/30' },
                ].map(btn => (
                  <button
                    key={btn.id}
                    onClick={() => { setRenderMode(btn.id); setXrayOn(btn.id === 'xray'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${renderMode === btn.id ? btn.ac : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-bold text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>1 critical</span>
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>1 elevated</span>
                </div>
                <button onClick={() => setAutoRotate(!autoRotate)} className={`p-1.5 rounded-lg border transition ${autoRotate ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`} title="Auto Rotate">
                  <RotateCw size={14} />
                </button>
                <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition" title="Toggle Fullscreen">
                  {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
              </div>
            </div>

            {/* 3D Canvas */}
            <div className="flex-1 relative">
              <BoneModelViewer
                viewAngle={viewAngle}
                heatmap={renderMode === 'heatmap'}
                wireframe={renderMode === 'wireframe'}
                meshMode={renderMode === 'mesh'}
                xray={renderMode === 'xray'}
                autoRotate={autoRotate}
                selectedRegion={selectedRegion}
                onSelectRegion={(id) => { setSelectedRegion(id); setSidebarTab('anatomy'); }}
                onZoneHover={setHoveredZone}
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

        {/* ── Right Clinical Sidebar ── */}
        <div className="space-y-3">
          {/* Live Zone Inspection Panel — replaces popup */}
          <ZoneInspectionPanel zone={activeZone} />

          {/* Anatomy / Biomarkers card */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="flex border-b border-slate-100">
              <button onClick={() => setSidebarTab('anatomy')} className={`flex-1 py-3 px-4 text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${sidebarTab === 'anatomy' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40' : 'text-slate-500 hover:text-slate-800'}`}>
                <Bone size={13} />Anatomy
              </button>
              <button onClick={() => setSidebarTab('biomarkers')} className={`flex-1 py-3 px-4 text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${sidebarTab === 'biomarkers' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/40' : 'text-slate-500 hover:text-slate-800'}`}>
                <FlaskConical size={13} />Biomarkers
              </button>
            </div>

            <div className="p-4 space-y-4">
              {sidebarTab === 'anatomy' ? (
                <>
                  {/* Zone Risk Index */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Zone Risk Index</p>
                    {STATIC_ZONES.map(z => {
                      const cfg = RISK_CFG[z.riskLevel];
                      const isActive = selectedRegion === z.id || hoveredZone?.id === z.id;
                      return (
                        <button
                          key={z.id}
                          type="button"
                          onClick={() => { setSelectedRegion(z.id); setSidebarTab('anatomy'); }}
                          className={`w-full text-left p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${isActive ? 'bg-slate-50 border-blue-500 ring-1 ring-blue-500/25' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                            <span className="text-xs font-bold text-slate-800">{z.label}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${cfg.badge}`}>{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Structural Metrics — shows active zone data */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Structural Metrics</p>
                      <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1"><Crosshair size={10}/>{activeZone?.label}</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { label: 'Trabecular vBMD', value: `${activeZone?.vBMD || '112.4'} mg/cm³` },
                        { label: 'T-Score',         value: activeZone?.tScore || '-2.3' },
                        { label: 'Cortical Thickness', value: activeZone?.riskLevel === 'high' ? '1.8 mm' : activeZone?.riskLevel === 'moderate' ? '2.6 mm' : '3.8 mm' },
                        { label: 'Fracture Risk',   value: activeZone?.riskLevel === 'high' ? '87%' : activeZone?.riskLevel === 'moderate' ? '52%' : '12%' },
                        { label: 'Bone Quality',    value: activeZone?.riskLevel === 'high' ? 'Osteopenic' : activeZone?.riskLevel === 'moderate' ? 'Reduced' : 'Normal' },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-1 border-b border-slate-50">
                          <span className="text-slate-500 font-medium">{label}</span>
                          <span className="font-bold text-slate-900">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Planning Notes */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1"><FileText size={10}/> Planning Notes</p>
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
                /* Biomarkers Tab */
                <div className="space-y-2.5">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Synchronized Lab Panel</p>
                  {BIOMARKER_INPUTS.map(item => {
                    const b = biomarkers?.[item.key] || {};
                    const status = b.status || 'normal';
                    return (
                      <div key={item.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-slate-700">{item.fullLabel}</span>
                          <span className="font-black text-slate-900 font-mono">{b.value ?? '—'} <span className="text-[10px] text-slate-500 font-normal">{item.unit}</span></span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Ref: {item.ref}</span>
                          <span className={`font-bold uppercase ${status === 'elevated' ? 'text-red-600' : status === 'low' ? 'text-amber-600' : 'text-teal-600'}`}>{status}</span>
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
