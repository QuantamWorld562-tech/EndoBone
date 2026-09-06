import { useParams, useNavigate } from 'react-router-dom';
import {
  Activity,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  FileSearch,
  ArrowRight,
  ShieldCheck,
  Info,
  BrainCircuit,
  Target,
  Zap,
  Plus,
  LayoutDashboard,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { AssessmentSkeleton, RiskDonut, EndocrineTrendChart } from '../../common';
import { usePatientContext } from '../../../context/PatientDataContext';

export default function AIAssessmentView({ patientId }) {
  const params = useParams();
  const navigate = useNavigate();
  const {
    assessment,
    persistedAssessment,
    isAnalyzing,
    isCaseLoading,
    biomarkers,
    activePatientId,
    setIsNewCaseModalOpen,
  } = usePatientContext();

  const effectivePatientId = patientId || params.patientId || activePatientId || null;

  if (isCaseLoading || isAnalyzing) {
    return <AssessmentSkeleton />;
  }

  if (!effectivePatientId || !assessment) {
    return (
      <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/40 rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 animate-fade-in">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-100 text-blue-600 ring-8 ring-blue-50/80 shadow-inner">
            <BrainCircuit size={32} />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            No AI Assessment Available
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm sm:text-base leading-relaxed">
            The workspace has been reset. To run predictive AI metabolic synthesis, evaluate bone quality indices, and generate clinical intervention pathways, choose an option below:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-3xl mx-auto">
          {/* Add New Case */}
          <div
            onClick={() => setIsNewCaseModalOpen(true)}
            className="group relative bg-white p-6 sm:p-7 rounded-3xl border-2 border-blue-200 hover:border-blue-500 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 group-hover:scale-110 transition-transform">
                <Plus size={24} />
              </div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  Add New Case
                </h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase">
                  <Sparkles size={11} /> New
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Enter endocrine lab results and patient details to calculate comprehensive metabolic risk and multi-disciplinary pathways.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs sm:text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
              <span>Open Case Creator</span>
              <ChevronRight size={16} className="ml-1" />
            </div>
          </div>

          {/* Select from Dashboard */}
          <div
            onClick={() => navigate('/dashboard')}
            className="group relative bg-white p-6 sm:p-7 rounded-3xl border-2 border-slate-200 hover:border-indigo-500 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-slate-800 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                <LayoutDashboard size={22} />
              </div>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Select from Recent Cases
                </h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase">
                  <FolderOpen size={11} /> Dashboard
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                Load previous patient cases and their historical AI synthesis and risk breakdown profiles.
              </p>
            </div>
            <div className="mt-6 flex items-center text-xs sm:text-sm font-bold text-indigo-600 group-hover:translate-x-1 transition-transform">
              <span>View Dashboard Cases</span>
              <ChevronRight size={16} className="ml-1" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const {
    overallQualityRisk,
    structuralVulnerability,
    dexa_tscore,
    insights,
    keyFactors,
    recommendedPathway,
    confidenceScore,
    clinicalNotes,
    generatedDate,
  } = assessment;

  const aiResults = persistedAssessment?.aiResults || null;

  const severityConfig = {
    high: {
      bar: 'bg-red-500',
      bg: 'bg-red-50',
      ring: 'ring-red-200',
      text: 'text-red-700',
      label: 'Critical Alert',
      border: 'border-l-red-600',
      icon: AlertTriangle,
      iconBg: 'bg-red-600',
    },
    moderate: {
      bar: 'bg-amber-500',
      bg: 'bg-amber-50',
      ring: 'ring-amber-200',
      text: 'text-amber-700',
      label: 'Important',
      border: 'border-l-amber-600',
      icon: Activity,
      iconBg: 'bg-amber-500',
    },
    low: {
      bar: 'bg-blue-500',
      bg: 'bg-blue-50',
      ring: 'ring-blue-200',
      text: 'text-blue-700',
      label: 'Note',
      border: 'border-l-blue-600',
      icon: CheckCircle2,
      iconBg: 'bg-blue-500',
    },
  };

  const dir = {
    up: { Icon: TrendingUp, cls: 'text-red-600 bg-red-50 ring-red-100' },
    down: { Icon: TrendingDown, cls: 'text-amber-600 bg-amber-50 ring-amber-100' },
    stable: { Icon: Minus, cls: 'text-teal-600 bg-teal-50 ring-teal-100' },
  };

  const priorityStyle = (p) =>
  ({
    critical: { ring: 'ring-red-200', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-600' },
    high: { ring: 'ring-amber-200', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
    moderate: { ring: 'ring-blue-200', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
    low: { ring: 'ring-teal-200', bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500' },
    routine: { ring: 'ring-slate-200', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-500' },
  }[p] || { ring: 'ring-slate-200', bg: 'bg-slate-50', text: 'text-slate-600', dot: 'bg-slate-500' });

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 min-w-0">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Explainable AI Assessment</h2>
            {aiResults && (
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                <BrainCircuit size={13} className="text-indigo-600" />
                AI LLM Synced
              </span>
            )}
          </div>
          <p className="text-slate-600 mt-0.5 sm:mt-1 text-xs sm:text-sm lg:text-base">Systemic factors impact analysis on structural bone risk.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
            <ShieldCheck size={15} className="text-blue-600" />
            <span className="text-slate-500 font-semibold">Confidence</span>
            <span className="font-black text-slate-900">{Math.round(confidenceScore * 100)}%</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs sm:text-sm">
            <span className="text-slate-500 font-semibold">DEXA</span>
            <span
              className={`font-black ${dexa_tscore <= -2.5
                ? 'text-red-600'
                : dexa_tscore <= -1
                  ? 'text-amber-600'
                  : 'text-teal-600'
                }`}
            >
              {dexa_tscore}
            </span>
          </div>
          {generatedDate && (
            <span className="text-[11px] text-slate-400 font-semibold hidden md:inline">
              {generatedDate}
            </span>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-5 sm:gap-6 min-w-0">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6 min-w-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm">
            <div className="text-xs font-black text-slate-400 tracking-widest uppercase mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              Overall Quality Risk
            </div>
            <RiskDonut
              value={overallQualityRisk}
              label="Metabolic + Structural"
              color="#dc2626"
              subColor="text-red-600"
              size={180}
              stroke={14}
              subtitle="Composite score integrating systemic metabolic stress with imaging-derived structural integrity."
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 lg:p-8 shadow-sm">
            <div className="text-xs font-black text-slate-400 tracking-widest uppercase mb-3 sm:mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              Structural Vulnerability
            </div>
            <RiskDonut
              value={structuralVulnerability}
              label="Cortical & Trabecular"
              color="#0d9488"
              subColor="text-teal-600"
              size={180}
              stroke={14}
              subtitle="Cortical porosity and trabecular microarchitecture assessment derived from CT analysis."
            />
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-sm min-w-0 max-w-full overflow-hidden">
            <EndocrineTrendChart biomarkers={biomarkers} />
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {/* LLM Clinical Intelligence Box (when available) */}
          {aiResults && (
            <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-2xl border border-indigo-500/30 p-7 shadow-xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                    <BrainCircuit size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                      AI Clinical Reasoning Engine
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${aiResults.risk_level === 'high'
                        ? 'bg-red-500/30 text-red-300 border border-red-400/40'
                        : aiResults.risk_level === 'moderate'
                          ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                          : 'bg-emerald-500/30 text-emerald-300 border border-emerald-400/40'
                        }`}>
                        {aiResults.risk_level} Risk Level
                      </span>
                    </h3>
                    <p className="text-xs text-indigo-200/80 font-medium">
                      Live generative multimodal inference over patient biochemical panel.
                    </p>
                  </div>
                </div>
                {aiResults.target_region && aiResults.target_region !== 'none' && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-indigo-200 bg-white/10 px-3 py-1 rounded-xl border border-white/10">
                    <Target size={13} className="text-indigo-400" />
                    Target: {aiResults.target_region.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4 pt-1">
                {aiResults.metabolic_observations && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-300 uppercase tracking-wider mb-2">
                      <Zap size={13} />
                      Metabolic Observations
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                      {aiResults.metabolic_observations}
                    </p>
                  </div>
                )}

                {aiResults.anatomical_observations && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-cyan-300 uppercase tracking-wider mb-2">
                      <Target size={13} />
                      Anatomical Observations
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-medium">
                      {aiResults.anatomical_observations}
                    </p>
                  </div>
                )}
              </div>

              {aiResults.contributing_factors?.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
                    <BrainCircuit size={12} className="text-indigo-400" />
                    AI Identified Drivers
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-black text-indigo-300">
                      {aiResults.contributing_factors.length}
                    </span>
                  </div>
                  <div className="grid gap-2">
                    {aiResults.contributing_factors.map((cf, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/10 transition"
                      >
                        <span className="mt-0.5 w-5 h-5 rounded-full bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-[10px] font-black text-indigo-300 flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-indigo-200 mb-0.5">
                            {cf.factor}
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed font-medium">
                            {cf.explanation}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Clinical Insights */}
          <div className="bg-gradient-to-br from-teal-50 via-white to-blue-50 rounded-2xl border border-teal-200/60 p-7 shadow-sm">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={22} strokeWidth={2.3} />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">AI Clinical Insights</h3>
                <p className="text-sm text-slate-600 font-medium">
                  Correlated findings across metabolic, endocrine, and structural modalities.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {insights.map((ins, i) => {
                const cfg = severityConfig[ins.severity] || severityConfig.low;
                const SevIcon = cfg.icon;
                return (
                  <div
                    key={i}
                    className={`bg-white rounded-xl p-4 border-l-4 ${cfg.border} border-t border-r border-b border-slate-100 shadow-sm`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ring-1 ${cfg.ring} ${cfg.text} ${cfg.bg}`}
                      >
                        <SevIcon size={12} />
                        {cfg.label}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        {ins.type}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 leading-relaxed">{ins.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Key Contributing Factors</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                {keyFactors.length} factors
              </span>
            </div>
            <div className="space-y-3">
              {keyFactors.map((f, i) => {
                const d = dir[f.direction || 'stable'];
                return (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-extrabold text-slate-900">
                          {f.label}: <span className="text-blue-700">{f.value}</span>{' '}
                          <span className="text-xs text-slate-500 font-semibold">{f.unit}</span>
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ring-1 ${d.cls}`}
                        >
                          <d.Icon size={11} />
                          {f.direction || 'stable'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{f.impact}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <FileSearch size={18} />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">Recommended Clinical Pathway</h3>
              </div>
            </div>

            <ol className="relative border-l-2 border-slate-200 ml-3 space-y-5">
              {recommendedPathway.map((step, i) => {
                const prio = priorityStyle(step.priority);
                return (
                  <li key={i} className="pl-6 relative">
                    <span
                      className={`absolute -left-[17px] top-0 w-8 h-8 rounded-full ${prio.bg} ring-4 ring-white flex items-center justify-center text-xs font-black ${prio.text} shadow-sm`}
                    >
                      {i + 1}
                    </span>
                    <div className={`p-4 rounded-xl border border-slate-100 ${prio.bg}/40`}>
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="font-extrabold text-slate-900">{step.step}</span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black ring-1 ${prio.ring} ${prio.text} ${prio.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${prio.dot}`} />
                          {step.priority?.toUpperCase()}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 ml-auto">
                          <Clock size={12} /> {step.timeframe}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed">{step.desc}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="flex flex-wrap gap-3 mt-7">
              <button
                onClick={() => navigate(`/patients/${effectivePatientId}/planning`)}
                className="flex-1 min-w-[160px] px-5 py-3 border-2 border-slate-200 text-slate-800 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-center gap-2"
              >
                Review 3D Planning
                <ArrowRight size={14} />
              </button>
              <button
                onClick={() => navigate(`/patients/${effectivePatientId}/summary`)}
                className="flex-1 min-w-[160px] px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
              >
                Approve Pathway & Surgery Summary
                <CheckCircle2 size={16} />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
            <div className="flex items-start gap-3">
              <Info className="text-slate-500 mt-0.5 flex-shrink-0" size={16} />
              <p className="text-sm text-slate-600 leading-relaxed">
                <span className="font-bold text-slate-800">Clinical Notes: </span>
                {aiResults?.metabolic_observations
                  ? `${aiResults.metabolic_observations} ${aiResults.anatomical_observations ? `(${aiResults.anatomical_observations})` : ''}`
                  : clinicalNotes}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

