import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Maximize2,
  Activity,
  AlertTriangle,
  FileDown,
  ChevronDown,
  Layers,
} from 'lucide-react';
import { useRegionalAnalysis } from '../../../hooks';
import { regionalAnalysisDB } from '../../../data/mockData';

function FemurSVG({ heatmap, selectedRegion, onRegionClick }) {
  return (
    <svg viewBox="0 0 400 500" className="w-full h-full max-h-[520px]">
      <defs>
        <linearGradient id="boneOuter" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#93c5fd" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="boneInner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#eff6ff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id="trabecular" cx="0.65" cy="0.35" r="0.4">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
        </radialGradient>
        <radialGradient id="heatGrad" cx="0.7" cy="0.3" r="0.45">
          <stop offset="0%" stopColor="#dc2626" stopOpacity="0.85" />
          <stop offset="40%" stopColor="#f59e0b" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0.15" />
        </radialGradient>
        <pattern id="trabPattern" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="0.9" fill="#ffffff" opacity="0.5" />
          <circle cx="8" cy="6" r="0.6" fill="#ffffff" opacity="0.35" />
          <circle cx="5" cy="10" r="0.5" fill="#ffffff" opacity="0.4" />
        </pattern>
      </defs>

      <ellipse cx="275" cy="90" rx="70" ry="55" fill="url(#boneOuter)" stroke="#3b82f6" strokeWidth="1.2" opacity="0.95" />
      <ellipse cx="275" cy="90" rx="55" ry="42" fill="url(#trabecular)" opacity="0.9" />
      <ellipse cx="275" cy="90" rx="55" ry="42" fill="url(#trabPattern)" opacity="0.85" />
      {selectedRegion === 'proximal-femur' && (
        <ellipse cx="275" cy="90" rx="72" ry="57" fill="none" stroke="#2563eb" strokeWidth="3" strokeDasharray="6 4">
          <animate attributeName="stroke-dashoffset" from="20" to="0" dur="1s" repeatCount="indefinite" />
        </ellipse>
      )}

      <path
        d="M 255 125 C 230 145, 205 170, 198 205 C 190 250, 195 300, 200 340 L 205 430 C 207 455, 195 470, 180 475 L 155 480 C 148 480, 145 474, 150 468 L 165 445 C 170 435, 168 425, 165 415 L 162 320 C 155 260, 158 200, 175 150 C 182 130, 200 115, 215 108 C 225 120, 242 122, 255 125 Z"
        fill="url(#boneOuter)"
        stroke="#3b82f6"
        strokeWidth="1.2"
        opacity="0.98"
      />
      <path
        d="M 230 140 C 215 155, 205 175, 202 200 C 198 240, 202 285, 207 325 L 210 415 C 211 435, 206 450, 198 460"
        fill="none"
        stroke="#bfdbfe"
        strokeWidth="2"
        opacity="0.8"
        strokeDasharray="3 5"
      />

      {heatmap ? (
        <>
          <ellipse cx="275" cy="90" rx="70" ry="55" fill="url(#heatGrad)" opacity="0.9" />
          <path
            d="M 255 125 C 230 145, 205 170, 198 205 C 190 250, 195 300, 200 340 L 205 430"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="8"
            opacity="0.25"
            strokeLinecap="round"
          />
        </>
      ) : (
        <ellipse cx="275" cy="90" rx="55" ry="42" fill="url(#trabPattern)" opacity="0.8" />
      )}

      <g style={{ cursor: 'pointer' }} onClick={() => onRegionClick('proximal-femur')}>
        <circle cx="275" cy="90" r="0" fill="transparent" />
      </g>
      <g style={{ cursor: 'pointer' }} onClick={() => onRegionClick('vertebral-body')}>
        <circle cx="200" cy="300" r="0" fill="transparent" />
      </g>

      <g opacity="0.9">
        <line x1="360" y1="50" x2="360" y2="135" stroke="#f87171" strokeWidth="2.5" />
        <line x1="356" y1="50" x2="364" y2="50" stroke="#f87171" strokeWidth="2.5" />
        <line x1="356" y1="135" x2="364" y2="135" stroke="#f87171" strokeWidth="2.5" />
        <text x="370" y="95" fontSize="11" fill="#ef4444" fontWeight="bold" fontFamily="system-ui">
          1.2 mm
        </text>
        <text x="370" y="108" fontSize="10" fill="#ef4444" fontWeight="600" fontFamily="system-ui" opacity="0.9">
          (normal 3.0)
        </text>
      </g>

      <text x="200" y="320" fontSize="13" fill="#1d4ed8" fontWeight="700" fontFamily="system-ui" opacity="0.85">
        Femoral Shaft
      </text>
      <text x="240" y="60" fontSize="13" fill="#1d4ed8" fontWeight="700" fontFamily="system-ui" opacity="0.85">
        Femoral Head / Neck
      </text>

      {selectedRegion === 'proximal-femur' && (
        <g>
          <line x1="275" y1="150" x2="275" y2="200" stroke="#1e40af" strokeWidth="1.5" strokeDasharray="3 3" />
          <polygon points="275,200 270,190 280,190" fill="#1e40af" />
        </g>
      )}
    </svg>
  );
}

export default function Planning3DView({ patientId }) {
  const params = useParams();
  const effectivePatientId = patientId || params.patientId || 'PEB-8842-A';
  const regions = regionalAnalysisDB[effectivePatientId] || {};
  const regionKeys = Object.keys(regions);
  const [viewMode, setViewMode] = useState('anatomical');
  const [zoom, setZoom] = useState(1);

  const { selectedRegion, regionData, selectRegion } = useRegionalAnalysis(
    effectivePatientId,
    regionKeys[0] || 'proximal-femur'
  );

  if (!regionData) {
    return <div className="p-10 text-center text-slate-500">Loading 3D planning data...</div>;
  }

  const statusColor = {
    high: {
      card: 'bg-red-50 border-red-200 ring-red-200',
      text: 'text-red-700',
      chip: 'bg-red-100 text-red-700 ring-red-200',
      dot: 'bg-red-600',
      value: 'text-red-600',
    },
    moderate: {
      card: 'bg-amber-50 border-amber-200 ring-amber-200',
      text: 'text-amber-700',
      chip: 'bg-amber-100 text-amber-700 ring-amber-200',
      dot: 'bg-amber-500',
      value: 'text-amber-600',
    },
    low: {
      card: 'bg-teal-50 border-teal-200 ring-teal-200',
      text: 'text-teal-700',
      chip: 'bg-teal-100 text-teal-700 ring-teal-200',
      dot: 'bg-teal-500',
      value: 'text-teal-600',
    },
  }[regionData.riskLevel || 'moderate'];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">3D Planning</h2>
          <p className="text-slate-600 mt-1 text-base">Interactive anatomical visualization and regional analysis.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold">View</span>
            <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('anatomical')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${
                    viewMode === 'anatomical'
                      ? 'bg-white text-blue-700 shadow-sm ring-2 ring-blue-200'
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <Layers size={15} />
                  Standard Anatomical View
                </button>
                <button
                  onClick={() => setViewMode('heatmap')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${
                    viewMode === 'heatmap'
                      ? 'bg-white text-amber-700 shadow-sm ring-2 ring-amber-200'
                      : 'text-slate-600 hover:bg-white/60'
                  }`}
                >
                  <Activity size={15} />
                  Metabolic Risk Heatmap
                  <span className="flex items-center gap-0.5 ml-1">
                    <span className="w-3 h-3 rounded-sm bg-teal-400" />
                    <span className="w-3 h-3 rounded-sm bg-amber-400" />
                    <span className="w-3 h-3 rounded-sm bg-red-500" />
                  </span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Interactive Model Loaded
                </span>
              </div>
            </div>

            <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-[560px] overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.12) 1px, transparent 1px)',
                  backgroundSize: '40px 40px',
                }}
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(59,130,246,0.25),transparent_60%)]" />

              <div
                className="relative w-full h-full flex items-center justify-center transition-transform duration-300 p-8"
                style={{ transform: `scale(${zoom})` }}
              >
                <FemurSVG
                  heatmap={viewMode === 'heatmap'}
                  selectedRegion={selectedRegion}
                  onRegionClick={selectRegion}
                />
              </div>

              <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur rounded-2xl shadow-xl overflow-hidden p-2 ring-1 ring-slate-200">
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { icon: ZoomIn, title: 'Zoom In', action: () => setZoom((z) => Math.min(z + 0.15, 2)) },
                    { icon: ZoomOut, title: 'Zoom Out', action: () => setZoom((z) => Math.max(z - 0.15, 0.6)) },
                    { icon: Move, title: 'Pan / Rotate', action: null },
                    { icon: RotateCw, title: 'Reset View', action: () => setZoom(1) },
                    { icon: Maximize2, title: 'Fullscreen', action: null, colSpan: true },
                  ].map((b, i) => (
                    <button
                      key={i}
                      title={b.title}
                      onClick={b.action}
                      className={`p-2.5 hover:bg-blue-50 rounded-xl text-slate-600 hover:text-blue-600 transition ${
                        b.colSpan ? 'col-span-2' : ''
                      }`}
                    >
                      <b.icon size={17} strokeWidth={2} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="absolute top-5 left-5 flex flex-col gap-2">
                {['Axial (3D)', 'Sagittal', 'Coronal'].map((label, i) => (
                  <button
                    key={label}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      i === 0
                        ? 'bg-white/95 text-blue-700 shadow'
                        : 'bg-slate-900/60 text-slate-300 hover:bg-slate-900/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="absolute top-5 right-5 bg-slate-900/70 backdrop-blur rounded-xl px-3 py-2 border border-slate-700/50 text-xs text-slate-300 font-semibold">
                Zoom: {Math.round(zoom * 100)}%
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">Region Analysis</h3>
            <p className="text-sm text-slate-500 font-medium mb-2">
              Selected: <span className="font-bold text-blue-700">{regionData.location}</span>
            </p>
            <select
              value={selectedRegion}
              onChange={(e) => selectRegion(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            >
              {regionKeys.map((k) => (
                <option key={k} value={k}>
                  {regions[k]?.location || k}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 font-medium">
              Anatomy: <span className="text-slate-700 font-bold">{regionData.anatomy}</span>
            </p>
          </div>

          <div className={`rounded-2xl border-2 p-6 shadow-sm ${statusColor.card} ring-1`}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center ring-1 ring-slate-200">
                <Activity size={18} className="text-blue-600" />
              </div>
              <h4 className="font-extrabold text-slate-900">AI Observation</h4>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">{regionData.observation}</p>
            <button className="text-blue-700 text-xs font-bold mt-3 hover:underline inline-flex items-center gap-1">
              Review Data →
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h4 className="text-base font-extrabold text-slate-900 mb-4">Volumetric Metrics</h4>
            <div className="space-y-4">
              {Object.entries(regionData.metrics || {}).map(([k, v]) => {
                const key = k.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
                const isEstimated = k.toLowerCase().includes('strength') && regionData.riskLevel === 'high';
                return (
                  <div key={k} className="pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <p className="text-xs text-slate-500 font-semibold mb-0.5">{key}</p>
                    <p className={`text-lg font-black ${isEstimated ? statusColor.value : 'text-slate-900'}`}>{v}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`rounded-2xl border-2 p-5 ring-1 ${statusColor.card}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className={statusColor.text} />
              <p className={`text-sm font-black ${statusColor.text}`}>
                Regional Status: {regionData.status}
              </p>
            </div>
            <p className={`text-[11px] font-bold mt-2 ${statusColor.text} opacity-80`}>
              {regionData.comparisonToPrevious}
            </p>
          </div>

          <button className="w-full px-5 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
            <FileDown size={17} />
            Generate ROI Report
          </button>
        </div>
      </div>
    </div>
  );
}
