import { useState, useEffect } from 'react';
import {
  Activity,
  Box,
  Brain,
  CheckCircle2,
  Clock,
  Sparkles,
  FlaskConical,
  Bone,
  Compass,
  Layers,
  LineChart,
  Crosshair,
  FileText,
  Maximize2,
  Play,
  Tag,
  ArrowUpRight,
} from 'lucide-react';

export function SkeletonBlock({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer ${className}`}
    />
  );
}

export function DarkSkeletonBlock({ className = '' }) {
  return (
    <div
      className={`rounded-xl bg-gradient-to-r from-slate-900 via-slate-800/90 to-slate-900 bg-[length:200%_100%] animate-shimmer border border-slate-800/60 ${className}`}
    />
  );
}

export function CaseLoadingOverlay({
  patientId = 'PEB-8842-A',
  patientName = 'Patient Case',
  procedure = 'Total Hip Arthroplasty (THA)',
}) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'Retrieving DEXA & Endocrine Lab Panels...',
    'Synthesizing Metabolic & Biomechanical Risk...',
    'Initializing Interactive 3D Bone Geometry...',
  ];

  useEffect(() => {
    const t1 = setTimeout(() => setStepIndex(1), 180);
    const t2 = setTimeout(() => setStepIndex(2), 360);
    const t3 = setTimeout(() => setStepIndex(3), 520);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/80 shadow-2xl p-8 space-y-6 overflow-hidden text-center animate-in zoom-in-95 duration-200">
        {/* Glow ambient circle */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Center Animated Icon with Rotating Ring */}
        <div className="relative inline-flex items-center justify-center mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-blue-500/30">
            <Activity size={36} className="animate-pulse" />
          </div>
          <div className="absolute -inset-2 rounded-3xl border-2 border-blue-500/30 border-t-blue-600 animate-spin" />
        </div>

        {/* Patient Badge */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-black tracking-wide">
            <Sparkles size={13} className="text-blue-600" />
            <span>{patientId}</span>
          </div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">
            {patientName}
          </h3>
          <p className="text-xs text-slate-500 font-medium truncate max-w-xs mx-auto">
            {procedure}
          </p>
        </div>

        {/* Step Progress Tracker */}
        <div className="space-y-2.5 bg-slate-50/80 border border-slate-100 rounded-2xl p-4 text-left">
          {steps.map((text, idx) => {
            const isDone = idx < stepIndex;
            const isCurrent = idx === stepIndex;
            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 text-xs transition-all duration-300 ${isDone
                    ? 'text-teal-700 font-semibold'
                    : isCurrent
                      ? 'text-blue-700 font-bold'
                      : 'text-slate-400'
                  }`}
              >
                {isDone ? (
                  <CheckCircle2 size={15} className="text-teal-600 shrink-0" />
                ) : isCurrent ? (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <Clock size={15} className="text-slate-300 shrink-0" />
                )}
                <span className="truncate">{text}</span>
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.round(((stepIndex + (stepIndex >= steps.length ? 1 : 0.6)) / steps.length) * 100))}%` }}
            />
          </div>
          <p className={`text-[11px] font-semibold tracking-wide transition-colors duration-300 ${stepIndex >= steps.length ? 'text-teal-600 font-bold' : 'text-slate-400'}`}>
            {stepIndex >= steps.length ? '✓ Patient Workspace Ready' : 'Loading Patient Workspace...'}
          </p>
        </div>
      </div>
    </div>
  );
}

export function AssessmentSkeleton() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-3">
          <SkeletonBlock className="h-10 w-80 max-w-full" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-3">
          <SkeletonBlock className="h-11 w-32" />
          <SkeletonBlock className="h-11 w-36" />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-44 w-44 rounded-full mx-auto" />
            <SkeletonBlock className="h-4 w-full" />
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-44 w-44 rounded-full mx-auto" />
            <SkeletonBlock className="h-4 w-full" />
          </div>
        </div>
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-7 w-64" />
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <div className="grid grid-cols-3 gap-3 pt-2">
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
              <SkeletonBlock className="h-20 w-full" />
            </div>
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-7 w-56" />
            <SkeletonBlock className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MetabolicAnalyzeSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2.5">
          <SkeletonBlock className="h-9 w-72 max-w-full" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <SkeletonBlock className="h-11 w-44" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-5 w-16 rounded-full" />
            </div>
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-3 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Planning3DSkeleton() {
  return (
    <div className="space-y-4 animate-fade-in pb-8">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4">
        <div className="min-w-0 space-y-1.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <SkeletonBlock className="h-8 sm:h-9 w-72 sm:w-96 rounded-xl" />
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-red-200/60 bg-red-50 text-[11px] font-black text-red-600">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>High Risk Active</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
              THA Workflow
            </span>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-4 w-64 sm:w-96 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200">
            <Brain size={14} className="text-slate-400" />
            <span className="hidden xs:inline">AI Assessment</span>
          </div>
          <div className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600/30 text-blue-200 rounded-xl text-xs font-bold border border-blue-500/30">
            <FileText size={14} />
            <span>Summary</span>
            <ArrowUpRight size={13} className="hidden sm:inline" />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5">
        {/* ── 3D Viewport Column (7 Cols on desktop) ── */}
        <div className="lg:col-span-7 flex flex-col gap-3 min-w-0 max-w-full">
          {/* Anatomy strip / DICOM Workstation Header */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 px-3.5 sm:px-4 py-2.5 flex items-center justify-between shadow-sm min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 pr-2 sm:pr-3 border-r border-slate-700 shrink-0">
                <Bone size={14} className="text-blue-400 animate-pulse" />
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest hidden xs:inline">
                  3D WORKSTATION
                </span>
              </div>
              <span className="text-xs font-bold text-slate-300 truncate flex items-center gap-2">
                <span>Femur Mesh • Reconstructing DICOM Geometry</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping shrink-0" />
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium shrink-0">
              <span className="inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300">
                <Compass size={11} className="text-cyan-400" /> 0.4mm Voxel
              </span>
              <span className="hidden md:inline text-slate-400 font-mono text-[10px]">
                AP CORONAL
              </span>
            </div>
          </div>

          {/* Viewer Card Container */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col min-h-[520px] sm:min-h-[580px] relative">
            {/* Toolbar */}
            <div className="px-3 sm:px-4 py-2 bg-[#0a0f1e] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 z-10 min-w-0">
              <div className="flex items-center gap-1 p-0.5 bg-slate-900/60 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none max-w-full">
                {[
                  { label: 'Anatomical', active: false },
                  { label: 'Risk Heatmap', active: true },
                  { label: 'X-Ray', active: false },
                  { label: 'Wireframe', active: false },
                  { label: 'Mesh', active: false },
                ].map((btn, idx) => (
                  <div
                    key={idx}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap ${
                      btn.active
                        ? 'bg-orange-600/80 text-white shadow-md shadow-orange-600/30'
                        : 'text-slate-500'
                    }`}
                  >
                    {btn.label}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <div className="flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg text-xs font-bold border border-blue-500/30 bg-blue-600/10 text-blue-300">
                  <Tag size={12} />
                  <span className="hidden sm:inline">Annotations</span>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800 text-[10px] font-bold text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>1 critical</span>
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>1 elevated</span>
                </div>
                <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400">
                  <Play size={12} />
                </div>
                <div className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-400">
                  <Maximize2 size={12} />
                </div>
              </div>
            </div>

            {/* Medical DICOM 3D Viewport Canvas Centerpiece */}
            <div className="flex-1 relative w-full h-full min-h-[420px] bg-slate-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] flex flex-col items-center justify-center p-6 overflow-hidden select-none">
              {/* Corner Reticle Brackets (Medical HUD Framing) */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50 pointer-events-none" />
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50 pointer-events-none" />
              <div className="absolute bottom-12 left-3 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50 pointer-events-none" />
              <div className="absolute bottom-12 right-3 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50 pointer-events-none" />

              {/* Top-Left Telemetry HUD */}
              <div className="absolute top-3.5 left-8 flex flex-col gap-0.5 text-[9px] font-mono text-cyan-400/80 pointer-events-none select-none z-10">
                <span className="font-black tracking-wider flex items-center gap-1.5 text-cyan-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  [DICOM 3D CAD ENGINE]
                </span>
                <span className="text-slate-400">PRESET: AP CORONAL (ORTHOGONAL)</span>
                <span className="text-slate-500">VOXEL GRID: 512 x 512 x 280 (0.4mm)</span>
              </div>

              {/* Top-Right 3D Coordinate Axis Tripod Widget */}
              <div className="absolute top-3.5 right-8 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-xl px-2.5 py-1.5 text-[9px] font-mono pointer-events-none select-none z-10">
                <svg viewBox="0 0 28 28" className="w-6 h-6 animate-radar">
                  <circle cx="14" cy="14" r="12" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="14" y1="14" x2="24" y2="14" stroke="#ef4444" strokeWidth="1.5" />
                  <line x1="14" y1="14" x2="14" y2="4" stroke="#10b981" strokeWidth="1.5" />
                  <line x1="14" y1="14" x2="7" y2="20" stroke="#06b6d4" strokeWidth="1.5" />
                </svg>
                <div className="flex flex-col text-[8.5px] leading-tight">
                  <span className="text-slate-300 font-bold">AXIS TRIPOD</span>
                  <span className="text-cyan-400">CALIBRATING</span>
                </div>
              </div>

              {/* Animated Vertical Laser Scanline Sweep */}
              <div className="absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent border-b border-cyan-400/80 animate-scanline pointer-events-none z-10" />

              {/* Anatomical Human Femur Holographic Wireframe SVG */}
              <div className="relative flex flex-col items-center justify-center my-2">
                <svg
                  viewBox="0 0 260 340"
                  className="w-56 h-72 sm:w-64 sm:h-80 drop-shadow-[0_0_25px_rgba(56,189,248,0.35)]"
                >
                  <defs>
                    <linearGradient id="femurBoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.9" />
                      <stop offset="50%" stopColor="#818cf8" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.9" />
                    </linearGradient>
                    <linearGradient id="hologramBeam" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0" />
                      <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </linearGradient>
                    <radialGradient id="ringGlow" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Base Platform Holographic Staging Rings */}
                  <ellipse cx="130" cy="315" rx="85" ry="16" fill="url(#ringGlow)" />
                  <ellipse
                    cx="130"
                    cy="315"
                    rx="85"
                    ry="16"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="opacity-40"
                  />
                  <ellipse
                    cx="130"
                    cy="315"
                    rx="55"
                    ry="10"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="1.2"
                    strokeDasharray="3 3"
                    className="opacity-60"
                  />
                  <ellipse
                    cx="130"
                    cy="315"
                    rx="25"
                    ry="5"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1.5"
                    className="opacity-75"
                  />

                  {/* Laser Beam Volumetric Shroud */}
                  <rect x="50" y="20" width="160" height="295" fill="url(#hologramBeam)" />

                  {/* Anatomical Femur Outer Contour */}
                  <path
                    d="M 80 82 C 68 62 88 40 108 42 C 122 44 132 58 132 74 C 132 85 142 98 155 104 C 168 110 188 95 198 102 C 205 107 202 125 196 142 C 190 158 180 185 176 220 L 168 312 L 138 312 L 140 220 C 140 195 130 182 122 176 C 114 170 108 172 108 162 C 108 152 118 138 116 122 C 114 106 94 100 80 82 Z"
                    fill="rgba(56, 189, 248, 0.05)"
                    stroke="url(#femurBoneGrad)"
                    strokeWidth="2.2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]"
                  />

                  {/* Femoral Head Spherical Articular Lattice */}
                  <ellipse
                    cx="106"
                    cy="62"
                    rx="24"
                    ry="20"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    className="opacity-50"
                  />
                  <path
                    d="M 86 64 Q 106 50 126 64"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    className="opacity-60"
                  />
                  <path
                    d="M 90 74 Q 106 60 122 74"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    className="opacity-60"
                  />

                  {/* Principal Compressive & Tensile Trabecular Trajectories (Singh Index / Ward's Triangle) */}
                  <path
                    d="M 140 160 Q 125 110 106 58"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1.4"
                    strokeDasharray="4 2"
                    className="opacity-70"
                  />
                  <path
                    d="M 148 175 Q 132 120 114 68"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="4 2"
                    className="opacity-60"
                  />
                  <path
                    d="M 188 118 Q 145 95 106 68"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="1.3"
                    strokeDasharray="3 3"
                    className="opacity-65"
                  />
                  <path
                    d="M 184 135 Q 148 112 118 82"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="1.1"
                    strokeDasharray="3 3"
                    className="opacity-55"
                  />

                  {/* Volumetric Cross-Sectional Geometry Slice Rings */}
                  <ellipse
                    cx="128"
                    cy="98"
                    rx="18"
                    ry="7"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    className="opacity-65"
                    transform="rotate(-32 128 98)"
                  />
                  <ellipse
                    cx="166"
                    cy="180"
                    rx="20"
                    ry="6"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    className="opacity-60"
                    transform="rotate(8 166 180)"
                  />
                  <ellipse
                    cx="156"
                    cy="245"
                    rx="16"
                    ry="5"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    className="opacity-55"
                  />
                  <ellipse
                    cx="153"
                    cy="290"
                    rx="15"
                    ry="5"
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    className="opacity-50"
                  />

                  {/* Medullary Canal Axis Guideline */}
                  <line
                    x1="153"
                    y1="175"
                    x2="153"
                    y2="310"
                    stroke="#38bdf8"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="opacity-40"
                  />

                  {/* Calcar Femorale Reinforcement Arc */}
                  <path
                    d="M 118 152 Q 128 128 126 102"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="1.6"
                    strokeDasharray="3 2"
                    className="opacity-80"
                  />

                  {/* Key Anatomical Landmark Pulsing Nodes */}
                  <circle cx="106" cy="62" r="3" fill="#38bdf8" className="animate-ping opacity-75" />
                  <circle cx="106" cy="62" r="2" fill="#ffffff" />
                  <circle cx="128" cy="98" r="2.5" fill="#f97316" />
                  <circle cx="188" cy="108" r="2.5" fill="#818cf8" />
                </svg>

                {/* Real-time Diagnostic HUD Telemetry Capsule */}
                <div className="relative mt-2 px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 backdrop-blur-md shadow-xl flex flex-col items-center gap-1.5 max-w-sm text-center">
                  <div className="flex items-center gap-2 text-xs font-black text-cyan-300">
                    <Layers size={14} className="text-cyan-400 animate-spin-slow" />
                    <span className="tracking-wide">RECONSTRUCTING FINITE ELEMENT BONE MESH</span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Sampling trabecular density &amp; regional microarchitecture...
                  </p>
                  <div className="w-56 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 animate-shimmer bg-[length:200%_100%] rounded-full" />
                  </div>
                  <div className="flex items-center justify-between w-full text-[9px] font-mono text-slate-400 pt-0.5">
                    <span>BV/TV: SYNC</span>
                    <span>T-SCORE: -2.3 SD</span>
                    <span>MESH: 0.4mm PBR</span>
                  </div>
                </div>
              </div>

              {/* Bottom-Right Clean Risk Heatmap Legend Skeleton */}
              <div className="pointer-events-none absolute right-3 bottom-3 z-10">
                <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-xl px-2.5 py-1.5 flex items-center gap-2">
                  <div className="w-1.5 h-8 rounded-full bg-gradient-to-t from-white via-orange-500 to-red-500 shrink-0" />
                  <div className="flex flex-col gap-0.5 text-[8px] font-black leading-none">
                    <span className="text-red-400">High Risk</span>
                    <span className="text-orange-400">Moderate</span>
                    <span className="text-slate-300">Normal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Scan Analysis Footer Bar */}
            <div className="px-4 py-2.5 bg-slate-900/95 border-t border-slate-800 text-xs font-semibold text-slate-300 flex flex-wrap items-center justify-between gap-2 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider">
                  Scan Analysis
                </span>
                <span className="text-slate-600">|</span>
                <span className="font-bold text-slate-200">Osteopenia (T-Score: -2.3)</span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-400 font-bold">Hip Fracture Risk: Moderate (9.4%)</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> T-Score &gt; 1.0
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> T-Score &lt; -2.5
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Clinical Sidebar Column (5 Cols on desktop) ── */}
        <div className="lg:col-span-5 space-y-4 min-w-0 max-w-full flex flex-col">
          {/* Multi-Tab Switcher */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-1.5 flex shadow-sm min-w-0 overflow-x-auto">
            <div className="flex-1 py-2 px-2.5 text-xs font-black rounded-xl bg-blue-600/80 text-white shadow-md shadow-blue-600/30 flex items-center justify-center gap-1.5 whitespace-nowrap">
              <LineChart size={13} className="shrink-0" />
              <span className="truncate">Endocrine Graphs</span>
            </div>
            <div className="flex-1 py-2 px-2.5 text-xs font-black rounded-xl text-slate-400 flex items-center justify-center gap-1.5 whitespace-nowrap">
              <Bone size={13} className="shrink-0" />
              <span className="truncate">Anatomy &amp; Notes</span>
            </div>
            <div className="flex-1 py-2 px-2.5 text-xs font-black rounded-xl text-slate-400 flex items-center justify-center gap-1.5 whitespace-nowrap">
              <FlaskConical size={13} className="shrink-0" />
              <span className="truncate">Lab Panel</span>
            </div>
          </div>

          {/* Endocrine Trend Curves Card Skeleton */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-3.5 sm:p-4 shadow-xl space-y-3.5 min-w-0 max-w-full overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="space-y-1">
                <DarkSkeletonBlock className="h-4 w-44" />
                <DarkSkeletonBlock className="h-3 w-28" />
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> PTH
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Ca²⁺
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> CTX
                </span>
              </div>
            </div>

            {/* High-Tech Spline Trend Curves SVG */}
            <div className="relative w-full h-32 bg-slate-950/60 rounded-xl border border-slate-800/80 p-2 overflow-hidden">
              <svg viewBox="0 0 380 100" className="w-full h-full">
                <defs>
                  <linearGradient id="areaGlowCyan" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="areaGlowAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Coordinate Grid Lines */}
                <line x1="20" y1="20" x2="360" y2="20" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="20" y1="50" x2="360" y2="50" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="20" y1="80" x2="360" y2="80" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />

                {/* Curve 1: Bone Resorption (Elevated CTX / High Risk) */}
                <path
                  d="M 20 75 Q 100 65 180 35 T 360 25 L 360 90 L 20 90 Z"
                  fill="url(#areaGlowAmber)"
                />
                <path
                  d="M 20 75 Q 100 65 180 35 T 360 25"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="2"
                  className="drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                />

                {/* Curve 2: Mineral Density Baseline */}
                <path
                  d="M 20 30 Q 100 45 180 60 T 360 70 L 360 90 L 20 90 Z"
                  fill="url(#areaGlowCyan)"
                />
                <path
                  d="M 20 30 Q 100 45 180 60 T 360 70"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  className="drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]"
                />

                {/* Data point nodes */}
                <circle cx="180" cy="35" r="3.5" fill="#f59e0b" className="animate-pulse" />
                <circle cx="180" cy="60" r="3.5" fill="#06b6d4" className="animate-pulse" />
                <circle cx="360" cy="25" r="3.5" fill="#ef4444" />
                <circle cx="360" cy="70" r="3.5" fill="#06b6d4" />
              </svg>

              {/* Time Timeline Labels */}
              <div className="flex justify-between text-[9px] font-mono text-slate-500 px-2 pt-0.5">
                <span>Baseline</span>
                <span>3 Months</span>
                <span>6 Months</span>
                <span>12 Months (Post-THA)</span>
              </div>
            </div>

            {/* Inspect Button Skeleton */}
            <div className="pt-2 border-t border-slate-800">
              <div className="w-full py-2.5 bg-blue-600/20 border border-blue-500/30 text-blue-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2">
                <Crosshair size={13} />
                <span>Inspect 3D Anatomical Risk Zones</span>
              </div>
            </div>
          </div>

          {/* Active Zone & Trabecular Architecture Inspection Skeleton */}
          <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3 min-w-0 max-w-full overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400">
                  ACTIVE REGION OF INTEREST
                </span>
                <DarkSkeletonBlock className="h-4 w-40" />
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-red-950/70 border border-red-500/40 text-red-300">
                HIGH RISK ZONE
              </span>
            </div>

            {/* 4 Microarchitecture Metrics in 2x2 Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-2.5 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>BV/TV</span>
                  <span className="text-red-400 font-mono font-bold">-28.4%</span>
                </div>
                <DarkSkeletonBlock className="h-4 w-16" />
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 w-1/3 rounded-full" />
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-2.5 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Tb.Th</span>
                  <span className="text-orange-400 font-mono font-bold">112 µm</span>
                </div>
                <DarkSkeletonBlock className="h-4 w-16" />
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 w-1/2 rounded-full" />
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-2.5 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>Tb.Sp</span>
                  <span className="text-amber-400 font-mono font-bold">248 µm</span>
                </div>
                <DarkSkeletonBlock className="h-4 w-16" />
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 w-3/4 rounded-full" />
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-2.5 space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                  <span>SMI</span>
                  <span className="text-teal-400 font-mono font-bold">2.8 Rod</span>
                </div>
                <DarkSkeletonBlock className="h-4 w-16" />
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-teal-500 w-2/3 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Planning Notes & Recommendations Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2.5 shadow-sm min-w-0 max-w-full overflow-hidden">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <FileText size={10} /> Planning Notes (Femoral Neck ROI)
              </p>
              <span className="text-[10px] text-slate-400">Auto-saved</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-4/5" />
              <SkeletonBlock className="h-3 w-3/5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PreSurgicalSummarySkeleton() {
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Skeleton */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <SkeletonBlock className="h-8 w-72 max-w-full" />
            <SkeletonBlock className="h-4 w-96 max-w-full" />
          </div>
          <div className="flex gap-2">
            <SkeletonBlock className="h-10 w-28 rounded-xl" />
            <SkeletonBlock className="h-10 w-36 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <SkeletonBlock className="h-14 w-full rounded-xl" />
          <SkeletonBlock className="h-14 w-full rounded-xl" />
          <SkeletonBlock className="h-14 w-full rounded-xl" />
          <SkeletonBlock className="h-14 w-full rounded-xl" />
        </div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-6 w-48" />
            <SkeletonBlock className="h-20 w-full rounded-2xl" />
            <SkeletonBlock className="h-28 w-full rounded-2xl" />
          </div>
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-6 w-40" />
            <div className="grid grid-cols-2 gap-3">
              <SkeletonBlock className="h-24 w-full rounded-xl" />
              <SkeletonBlock className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <SkeletonBlock className="h-6 w-44" />
            <SkeletonBlock className="h-40 w-full rounded-2xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-64" />
          <SkeletonBlock className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-32 rounded-xl" />
          <SkeletonBlock className="h-10 w-28 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="h-8 w-20" />
            <SkeletonBlock className="h-3 w-36" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <SkeletonBlock className="h-6 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonBlock key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <SkeletonBlock className="h-8 w-56" />
          <SkeletonBlock className="h-4 w-80" />
        </div>
        <SkeletonBlock className="h-10 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <SkeletonBlock className="h-5 w-32" />
            <SkeletonBlock className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <SkeletonBlock className="h-6 w-44" />
        <SkeletonBlock className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export function AppLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 space-y-6 text-center shadow-lg">
        <SkeletonBlock className="w-16 h-16 rounded-2xl mx-auto" />
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-48 mx-auto" />
          <SkeletonBlock className="h-4 w-64 mx-auto" />
        </div>
        <SkeletonBlock className="h-2 w-full rounded-full" />
      </div>
    </div>
  );
}

export function WorkspaceRouteSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <SkeletonBlock className="h-12 w-full rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SkeletonBlock className="h-96 lg:col-span-2 rounded-3xl" />
        <SkeletonBlock className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}


