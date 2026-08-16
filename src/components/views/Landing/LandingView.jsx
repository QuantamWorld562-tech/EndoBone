import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  Play,
  Activity,
  BarChart3,
  Box,
  Shield,
  Sparkles,
  ArrowUpRight,
  FileCheck,
  Brain,
  Dna,
  FlaskConical,
} from 'lucide-react';

export default function LandingView({ onStart }) {
  const navigate = useNavigate();
  const handleStart = onStart || (() => navigate('/dashboard'));
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/40">
      <header className="border-b border-slate-200/70 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Dna size={22} className="text-white" strokeWidth={2.3} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">EndoBone AI</h1>
              <p className="text-xs text-slate-500 font-medium">Precision Diagnostics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition items-center gap-1.5">
              Clinical Portal
              <ArrowUpRight size={14} />
            </button>
            <button
              onClick={handleStart}
              className="group px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/20 flex items-center gap-2 border-2 border-dashed border-blue-200"
            >
              Start Assessment
              <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-200/80 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </span>
              <span className="text-xs font-bold text-blue-700 tracking-wide">NEXT-GEN DECISION SUPPORT</span>
            </div>

            <h2 className="text-5xl lg:text-6xl font-black text-slate-900 leading-[1.05] tracking-tight">
              Bridging the gap between{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent">
                  3D anatomical
                </span>
                <span className="absolute bottom-1 left-0 h-3 bg-blue-200/50 w-full -z-0 rounded"></span>
              </span>{' '}
              information and biochemical data.
            </h2>

            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              EndoBone AI integrates high-fidelity multi-modal imaging with complex biochemical profiles
              to generate patient-specific bone health assessments, enabling objective, data-driven
              clinical decisions for pre-surgical planning.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleStart}
                className="group px-7 py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-xl shadow-blue-600/30 flex items-center gap-2.5 border-2 border-dashed border-blue-300/70"
              >
                <Box size={20} />
                Start Patient Assessment
                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="group px-7 py-3.5 border-2 border-slate-200 bg-white text-slate-800 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition flex items-center gap-2.5 shadow-sm">
                <Play size={18} className="text-blue-600 fill-blue-600" />
                View Demo
              </button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              {[
                { value: '4', label: 'Patients Analyzed' },
                { value: '89%', label: 'Avg. AI Confidence' },
                { value: '6', label: 'Biomarkers Profiled' },
              ].map((s, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-2xl font-black text-slate-900">{s.value}</div>
                  <div className="text-xs text-slate-500 font-medium">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-10 -left-10 w-48 h-48 bg-blue-200/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-indigo-200/30 rounded-full blur-3xl" />

            <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-900/10 overflow-hidden border border-slate-200">
              <div className="absolute top-0 left-0 right-0 z-10 h-10 bg-gradient-to-b from-slate-50 to-transparent flex items-center px-5 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="text-xs text-slate-500 ml-3 font-medium">EndoBone AI — Clinical Workspace</div>
              </div>

              <div className="pt-12 p-6">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700/50">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(59,130,246,0.18),transparent_55%)]" />
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage:
                        'linear-gradient(rgba(255,255,255,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.07) 1px, transparent 1px)',
                      backgroundSize: '32px 32px',
                    }}
                  />

                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg viewBox="0 0 300 320" className="w-4/5 h-4/5 drop-shadow-[0_0_40px_rgba(59,130,246,0.5)]">
                      <defs>
                        <linearGradient id="boneGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.9" />
                          <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.85" />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
                        </linearGradient>
                        <radialGradient id="trabGrad" cx="0.5" cy="0.5" r="0.5">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.1" />
                        </radialGradient>
                      </defs>
                      <path
                        d="M220 40 C 260 55, 275 95, 250 130 C 230 155, 200 165, 180 180 C 170 195, 168 210, 165 230 L 160 270 C 155 290, 145 300, 130 305 C 115 300, 105 290, 100 270 L 95 230 C 92 210, 90 195, 80 180 C 60 165, 30 155, 10 130 C -15 95, 0 55, 40 40 C 65 32, 85 50, 100 70 C 120 90, 120 115, 130 135 C 133 142, 140 145, 145 142 C 155 115, 155 90, 175 70 C 190 50, 210 32, 220 40 Z"
                        fill="url(#boneGrad)"
                        stroke="#bfdbfe"
                        strokeWidth="1.5"
                        opacity="0.95"
                      />
                      <ellipse cx="230" cy="100" rx="32" ry="28" fill="url(#trabGrad)" />
                      <g opacity="0.75" fill="#e0f2fe">
                        {Array.from({ length: 28 }).map((_, i) => (
                          <circle
                            key={i}
                            cx={210 + (i % 7) * 8}
                            cy={80 + Math.floor(i / 7) * 8 + ((i % 2) * 2)}
                            r={1.2 + ((i * 13) % 10) / 10}
                          />
                        ))}
                      </g>
                      <path d="M130 160 L 130 240" stroke="#1e3a8a" strokeWidth="2" opacity="0.4" strokeDasharray="4 6" />
                    </svg>
                  </div>

                  <div className="absolute top-4 left-4 bg-slate-900/70 backdrop-blur rounded-xl px-3 py-2 border border-slate-700/50">
                    <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
                      <Sparkles size={13} />
                      BONE MINERAL DENSITY
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-black text-white">0.741</span>
                      <span className="text-[10px] text-slate-400">g/cm² | T-Score:</span>
                      <span className="text-sm font-bold text-red-400">-2.8</span>
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 bg-slate-900/70 backdrop-blur rounded-xl p-3 border border-slate-700/50 w-44 space-y-2.5">
                    {[
                      { label: 'Trabecular vBMD', val: '112.4', unit: 'mg/cm³', color: 'text-amber-300' },
                      { label: 'Cortical Thickness', val: '1.2', unit: 'mm', color: 'text-red-400' },
                      { label: 'Trabecular Pattern', val: 'Irregular', unit: '', color: 'text-amber-300' },
                    ].map((m, i) => (
                      <div key={i} className="flex justify-between items-start">
                        <span className="text-[10px] text-slate-400 font-medium leading-tight">{m.label}</span>
                        <div className="text-right">
                          <span className={`text-xs font-bold ${m.color}`}>{m.val}</span>
                          <span className="text-[10px] text-slate-500 ml-1">{m.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="absolute bottom-4 right-4 bg-white rounded-xl px-4 py-3 shadow-xl border border-slate-200">
                    <div className="text-[11px] font-bold text-slate-500 mb-0.5">T-Score</div>
                    <div className="text-2xl font-black text-red-600 leading-none">-2.8</div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs font-bold text-red-600">
                      <span>⌵</span>
                      High Risk
                    </div>
                  </div>

                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-emerald-500/20 backdrop-blur border border-emerald-400/30 rounded-full px-3 py-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-300">AI ANALYSIS COMPLETE</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  {[
                    { label: 'Overall Risk', val: '75%', tone: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-100' },
                    { label: 'Structural', val: '30%', tone: 'text-teal-600', bg: 'bg-teal-50', ring: 'ring-teal-100' },
                    { label: 'Confidence', val: '87%', tone: 'text-blue-600', bg: 'bg-blue-50', ring: 'ring-blue-100' },
                  ].map((m, i) => (
                    <div key={i} className={`${m.bg} rounded-xl p-3 ring-1 ${m.ring}`}>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{m.label}</div>
                      <div className={`text-xl font-black ${m.tone} mt-0.5`}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-slate-200 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-full border border-slate-200 mb-5">
              <FileCheck size={14} className="text-blue-600" />
              <span className="text-xs font-bold text-slate-600 tracking-wide">COMPREHENSIVE ANALYSIS</span>
            </div>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">
              Unify every data stream into one cohesive assessment
            </h3>
            <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-lg">
              From metabolic biomarkers to volumetric structural metrics — every signal fused through explainable AI.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Box,
                tag: '01',
                title: '3D Anatomy & Imaging',
                desc: 'Multi-modal imaging integration with cortical & trabecular microarchitecture analysis for every ROI.',
                bullets: ['Volumetric BMD mapping', 'Cortical thickness profiling', 'Multi-region comparison'],
                accent: 'from-blue-500 to-blue-700',
                bgAccent: 'bg-blue-50',
                ring: 'ring-blue-100',
              },
              {
                icon: BarChart3,
                tag: '02',
                title: 'Metabolic & Endocrine Context',
                desc: 'Endocrine biomarker profiling, historical trending, and systemic bone-health indicators.',
                bullets: ['PTH / Vitamin D / Calcium panel', 'CTX / P1NP turnover markers', '6-month trend analysis'],
                accent: 'from-amber-500 to-orange-600',
                bgAccent: 'bg-amber-50',
                ring: 'ring-amber-100',
              },
              {
                icon: Brain,
                tag: '03',
                title: 'Explainable AI Assessment',
                desc: 'Transparent risk stratification with anatomical-metabolic correlation and clinical pathway steps.',
                bullets: ['Contributing-factor breakdown', 'Confidence-weighted insights', 'Recommended pathway with timeline'],
                accent: 'from-emerald-500 to-teal-700',
                bgAccent: 'bg-emerald-50',
                ring: 'ring-emerald-100',
              },
            ].map((card) => (
              <div
                key={card.tag}
                className={`group relative rounded-2xl border border-slate-200 bg-white p-7 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${card.bgAccent}/30`}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.accent} flex items-center justify-center shadow-lg mb-5`}>
                  <card.icon className="text-white" size={26} strokeWidth={2.2} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ring-1 ${card.ring} text-slate-600 bg-white`}>
                    STEP {card.tag}
                  </span>
                </div>
                <h4 className="text-xl font-extrabold text-slate-900 mb-2">{card.title}</h4>
                <p className="text-sm text-slate-600 leading-relaxed mb-5">{card.desc}</p>
                <ul className="space-y-2">
                  {card.bullets.map((b, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${card.accent}`} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-20 text-white relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, rgba(59,130,246,0.4), transparent 40%), radial-gradient(circle at 80% 50%, rgba(139,92,246,0.3), transparent 40%)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/15 backdrop-blur-sm mb-6">
            <Shield size={14} className="text-blue-300" />
            <span className="text-xs font-bold tracking-wide text-blue-200">FOR CLINICAL RESEARCH USE</span>
          </div>
          <h3 className="text-4xl lg:text-5xl font-black tracking-tight mb-5">
            Ready to elevate pre-surgical bone assessment?
          </h3>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            Launch the interactive demo with anonymized sample patient PEB-8842-A. No setup, no login — all screens and
            flows fully accessible.
          </p>
          <button
            onClick={handleStart}
            className="group inline-flex items-center gap-2.5 px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-blue-50 transition shadow-2xl text-base"
          >
            <Activity size={20} className="text-blue-600" />
            Launch Interactive Workflow
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform text-blue-600" />
          </button>
          <p className="text-xs text-slate-400 mt-6">
            © 2024 EndoBone AI. For clinical research use only. Not a replacement for professional medical judgment.
          </p>
        </div>
      </section>
    </div>
  );
}
