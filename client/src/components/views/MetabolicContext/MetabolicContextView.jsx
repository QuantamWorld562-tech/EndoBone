import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Info,
  FlaskConical,
  Activity,
  BarChart2,
} from 'lucide-react';
import { usePatientContext } from '../../../context/PatientDataContext';
import { useTrendingData } from '../../../hooks';
import { MetabolicAnalyzeSkeleton } from '../../common';

export default function MetabolicContextView({ patientId, onRunAssessment }) {
  const params = useParams();
  const navigate = useNavigate();
  const effectivePatientId = patientId || params.patientId || 'PEB-8842-A';
  const { biomarkers, updateBiomarker, runAssessment, isAnalyzing } = usePatientContext();

  const isInputValid = useMemo(() => {
    if (!biomarkers) return false;
    const requiredKeys = ['pth', 'vitaminD', 'calcium', 'phosphate', 'alp', 'ctx'];
    return requiredKeys.every((k) => {
      const val = biomarkers[k]?.value;
      if (val === '' || val === null || val === undefined) return false;
      const num = typeof val === 'number' ? val : parseFloat(val);
      return Number.isFinite(num) && num > 0;
    });
  }, [biomarkers]);

  const handleRunAssessment = onRunAssessment || (async () => {
    await runAssessment(effectivePatientId, biomarkers);
    navigate(`/patients/${effectivePatientId}/assessment`);
  });


  const { trendData } = useTrendingData(effectivePatientId);

  if (!biomarkers) {
    return <div className="p-10 text-center text-slate-500">Loading metabolic profile...</div>;
  }

  const getStatusBadge = (key) => {
    const data = biomarkers[key];
    if (!data) return null;
    const status = data.status || 'normal';
    if (status === 'elevated' || status === 'high') {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-700 ring-1 ring-red-200">High</span>;
    }
    if (status === 'low' || status === 'deficient') {
      return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-700 ring-1 ring-amber-200">Low</span>;
    }
    return null;
  };

  const getBorderColor = (key) => {
    const data = biomarkers[key];
    if (!data) return 'border-slate-200';
    const status = data.status || 'normal';
    if (status === 'elevated' || status === 'high') return 'border-red-400 ring-1 ring-red-300';
    if (status === 'low' || status === 'deficient') return 'border-amber-400 ring-1 ring-amber-300';
    return 'border-slate-200';
  };

  const renderTrendChart = (key, color) => {
    if (!trendData?.lastSixMonths) return null;
    const points = trendData.lastSixMonths;
    const values = points.map((p) => p[key]).filter((v) => v != null);
    if (values.length < 2) return null;
    const min = Math.min(...values) * 0.9;
    const max = Math.max(...values) * 1.05;
    const w = 320;
    const h = 50;
    const stepX = w / (values.length - 1);
    const coords = values.map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / (max - min)) * h;
      return [x, y];
    });
    const path = coords.map((c, i) => (i === 0 ? `M ${c[0]},${c[1]}` : `L ${c[0]},${c[1]}`)).join(' ');
    const areaPath = `${path} L ${w},${h} L 0,${h} Z`;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
        <defs>
          <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${key})`} />
        <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  const abnormalCount = Object.entries(biomarkers).filter(
    ([_, v]) => typeof v === 'object' && v.status && v.status !== 'normal'
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Biomarker Input</h2>
          <p className="text-slate-600 mt-1 text-base">
            Enter recent lab results to update patient risk profile and 3D simulation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
              abnormalCount > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}
          >
            <AlertTriangle size={16} className={abnormalCount > 0 ? 'text-red-600' : 'text-teal-600'} />
            <span className="font-bold text-xs">
              {abnormalCount} Out-of-Range {abnormalCount === 1 ? 'Biomarker' : 'Biomarkers'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid — matching user reference screenshot */}
      <div className="grid lg:grid-cols-5 gap-6">
        
        {/* Left Card: Bone Metabolism Panel (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <FlaskConical size={18} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">Bone Metabolism Panel</h3>
          </div>

          <div className="space-y-4">
            {/* PTH */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold min-w-[200px]">
                <span>Parathyroid Hormone (PTH)</span>
                <span title="NHANES LBXPT21 (Ref: 15.0–65.0 pg/mL)" className="text-slate-400 hover:text-slate-600 cursor-help">
                  <Info size={14} />
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-1 justify-end">
                <div className={`flex items-center border rounded-xl overflow-hidden bg-white shadow-sm transition ${getBorderColor('pth')}`}>
                  <input
                    type="number"
                    step="0.1"
                    value={biomarkers.pth?.value ?? ''}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'pth', e.target.value)}
                    className="w-28 px-3.5 py-2 text-sm font-black text-slate-900 focus:outline-none text-right"
                  />
                  <span className="px-3 py-2 bg-slate-50 text-slate-500 font-semibold text-xs border-l border-slate-200">
                    pg/mL
                  </span>
                </div>
                {getStatusBadge('pth')}
              </div>
            </div>

            {/* Vitamin D */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold min-w-[200px]">
                <span>Vitamin D (25-OH)</span>
                <span title="NHANES 2017–2018 (Ref: 30.0–100.0 ng/mL)" className="text-slate-400 hover:text-slate-600 cursor-help">
                  <Info size={14} />
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-1 justify-end">
                <div className={`flex items-center border rounded-xl overflow-hidden bg-white shadow-sm transition ${getBorderColor('vitaminD')}`}>
                  <input
                    type="number"
                    step="0.1"
                    value={biomarkers.vitaminD?.value ?? ''}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'vitaminD', e.target.value)}
                    className="w-28 px-3.5 py-2 text-sm font-black text-slate-900 focus:outline-none text-right"
                  />
                  <span className="px-3 py-2 bg-slate-50 text-slate-500 font-semibold text-xs border-l border-slate-200">
                    ng/mL
                  </span>
                </div>
                {getStatusBadge('vitaminD')}
              </div>
            </div>

            {/* Serum Calcium */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold min-w-[200px]">
                <span>Serum Calcium</span>
                <span title="NHANES LBXSCA (Ref: 8.6–10.3 mg/dL)" className="text-slate-400 hover:text-slate-600 cursor-help">
                  <Info size={14} />
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-1 justify-end">
                <div className={`flex items-center border rounded-xl overflow-hidden bg-white shadow-sm transition ${getBorderColor('calcium')}`}>
                  <input
                    type="number"
                    step="0.1"
                    value={biomarkers.calcium?.value ?? ''}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'calcium', e.target.value)}
                    className="w-28 px-3.5 py-2 text-sm font-black text-slate-900 focus:outline-none text-right"
                  />
                  <span className="px-3 py-2 bg-slate-50 text-slate-500 font-semibold text-xs border-l border-slate-200">
                    mg/dL
                  </span>
                </div>
                {getStatusBadge('calcium')}
              </div>
            </div>

            {/* Serum Phosphate */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold min-w-[200px]">
                <span>Serum Phosphate</span>
                <span title="NHANES LBXSPH (Ref: 2.5–4.5 mg/dL)" className="text-slate-400 hover:text-slate-600 cursor-help">
                  <Info size={14} />
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-1 justify-end">
                <div className={`flex items-center border rounded-xl overflow-hidden bg-white shadow-sm transition ${getBorderColor('phosphate')}`}>
                  <input
                    type="number"
                    step="0.1"
                    value={biomarkers.phosphate?.value ?? ''}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'phosphate', e.target.value)}
                    className="w-28 px-3.5 py-2 text-sm font-black text-slate-900 focus:outline-none text-right"
                  />
                  <span className="px-3 py-2 bg-slate-50 text-slate-500 font-semibold text-xs border-l border-slate-200">
                    mg/dL
                  </span>
                </div>
                {getStatusBadge('phosphate')}
              </div>
            </div>

            {/* Alkaline Phosphatase */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold min-w-[200px]">
                <span>Alkaline Phosphatase (ALP)</span>
                <span title="NHANES LBXSAPSI (Ref: 44–147 IU/L)" className="text-slate-400 hover:text-slate-600 cursor-help">
                  <Info size={14} />
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-1 justify-end">
                <div className={`flex items-center border rounded-xl overflow-hidden bg-white shadow-sm transition ${getBorderColor('alp')}`}>
                  <input
                    type="number"
                    step="1"
                    value={biomarkers.alp?.value ?? ''}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'alp', e.target.value)}
                    className="w-28 px-3.5 py-2 text-sm font-black text-slate-900 focus:outline-none text-right"
                  />
                  <span className="px-3 py-2 bg-slate-50 text-slate-500 font-semibold text-xs border-l border-slate-200">
                    IU/L
                  </span>
                </div>
                {getStatusBadge('alp')}
              </div>
            </div>

            {/* CTX-I Resorption Marker */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold min-w-[200px]">
                <span>CTX-I (Resorption)</span>
                <span title="Bone Turnover Resorption Marker (Ref: < 300 pg/mL)" className="text-slate-400 hover:text-slate-600 cursor-help">
                  <Info size={14} />
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-1 justify-end">
                <div className={`flex items-center border rounded-xl overflow-hidden bg-white shadow-sm transition ${getBorderColor('ctx')}`}>
                  <input
                    type="number"
                    step="10"
                    value={biomarkers.ctx?.value ?? ''}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'ctx', e.target.value)}
                    className="w-28 px-3.5 py-2 text-sm font-black text-slate-900 focus:outline-none text-right"
                  />
                  <span className="px-3 py-2 bg-slate-50 text-slate-500 font-semibold text-xs border-l border-slate-200">
                    pg/mL
                  </span>
                </div>
                {getStatusBadge('ctx')}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Thyroid Function & Analyze Action Card (2 Cols) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          
          {/* Thyroid Function Card */}
          {/*
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Activity size={18} />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Thyroid Function</h3>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                  <span>TSH</span>
                  <span title="Ref: 0.4–4.0 mIU/L" className="text-slate-400 cursor-help"><Info size={13} /></span>
                </div>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <input
                    type="number"
                    step="0.1"
                    value={biomarkers.tsh?.value ?? 2.1}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'tsh', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-black text-slate-900 focus:outline-none"
                  />
                  <span className="px-3 py-2 bg-slate-50 text-slate-500 font-semibold text-xs border-l border-slate-200">
                    mIU/L
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-700">
                  <span>Free T4</span>
                  <span title="Ref: 0.8–1.8 ng/dL" className="text-slate-400 cursor-help"><Info size={13} /></span>
                </div>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <input
                    type="number"
                    step="0.1"
                    value={biomarkers.free_t4?.value ?? 1.2}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'free_t4', e.target.value)}
                    className="w-full px-3.5 py-2 text-sm font-black text-slate-900 focus:outline-none"
                  />
                  <span className="px-3 py-2 bg-slate-50 text-slate-500 font-semibold text-xs border-l border-slate-200">
                    ng/dL
                  </span>
                </div>
              </div>
            </div>
          </div>
          */}

          {/* Action Verification Card */}
          {isAnalyzing ? (
            <MetabolicAnalyzeSkeleton />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Ensure all out-of-range values are verified before proceeding to analysis.
              </p>

              <button
                onClick={handleRunAssessment}
                disabled={isAnalyzing}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 text-white shadow-blue-900/20 cursor-pointer"
              >
                <BarChart2 size={18} />
                Analyze Patient Data
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

