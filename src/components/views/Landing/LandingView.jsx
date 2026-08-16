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
            <div className="w-11 h-11 ">
              <img src="/logo2.png" alt="EndoBone AI" className="w-full h-full object-cover" />
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
            <div className="absolute -top-10 -left-10 w-56 h-56 bg-blue-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl" />

            <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-900/15 overflow-hidden border border-slate-200/80 transition-all duration-300 hover:shadow-blue-500/10">
              {/* Card Window Topbar */}
              <div className="h-11 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 flex items-center justify-between px-5 border-b border-slate-700/60">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/90" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/90" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/90" />
                  <span className="text-xs text-slate-300 ml-2 font-bold tracking-tight">EndoBone AI — 3D Surgical Suite</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-[10px] font-extrabold text-blue-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <span>LIVE SURGICAL SIMULATION</span>
                </div>
              </div>

              {/* Main Image Container */}
              <div className="p-4 bg-slate-950">
                <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-inner group">
                  <img
                    src="/hero-bone-display.png"
                    alt="EndoBone AI 3D Surgical Display"
                    className="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Sub-Metrics Strip */}
                <div className="grid grid-cols-3 gap-3 mt-4">
                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Overall Risk</div>
                    <div className="text-lg font-black text-red-400 mt-0.5 flex items-baseline gap-1">
                      75% <span className="text-[10px] font-bold text-red-500/80">HIGH</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">DEXA T-Score</div>
                    <div className="text-lg font-black text-amber-400 mt-0.5">-2.8</div>
                  </div>
                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">AI Confidence</div>
                    <div className="text-lg font-black text-blue-400 mt-0.5">91%</div>
                  </div>
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
