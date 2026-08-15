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
} from 'lucide-react';
import { RiskDonut } from '../../common';
import { useAssessment } from '../../../hooks';

export default function AIAssessmentView({ patientId }) {
  const params = useParams();
  const navigate = useNavigate();
  const effectivePatientId = patientId || params.patientId || 'PEB-8842-A';
  const { assessment, loading } = useAssessment(effectivePatientId);

  if (loading || !assessment) {
    return <div className="p-10 text-center text-slate-500">Running AI assessment...</div>;
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
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Explainable AI Assessment</h2>
          <p className="text-slate-600 mt-1 text-base">Systemic factors impact analysis on structural bone risk.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <ShieldCheck size={16} className="text-blue-600" />
            <span className="text-sm text-slate-500 font-semibold">Confidence</span>
            <span className="text-sm font-black text-slate-900">{Math.round(confidenceScore * 100)}%</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-sm text-slate-500 font-semibold">DEXA T-Score</span>
            <span
              className={`text-base font-black ${
                dexa_tscore <= -2.5
                  ? 'text-red-600'
                  : dexa_tscore <= -1
                  ? 'text-amber-600'
                  : 'text-teal-600'
              }`}
            >
              {dexa_tscore}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">Generated {generatedDate}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              Overall Quality Risk
            </div>
            <RiskDonut
              value={overallQualityRisk}
              label="Metabolic + Structural"
              color="#dc2626"
              subColor="text-red-600"
              size={200}
              stroke={16}
              subtitle="Composite score integrating systemic metabolic stress with imaging-derived structural integrity."
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
            <div className="text-xs font-black text-slate-400 tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              Structural Vulnerability
            </div>
            <RiskDonut
              value={structuralVulnerability}
              label="Cortical & Trabecular"
              color="#0d9488"
              subColor="text-teal-600"
              size={200}
              stroke={16}
              subtitle="Cortical porosity and trabecular microarchitecture assessment derived from CT analysis."
            />
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
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
                {clinicalNotes}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
