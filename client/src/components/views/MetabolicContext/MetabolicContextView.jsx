import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Info,
  FlaskConical,
  BarChart2,
  Plus,
  Sparkles,
  LayoutDashboard,
  ChevronRight,
  FolderOpen,
} from 'lucide-react';
import { usePatientContext } from '../../../context/PatientDataContext';
import { MetabolicAnalyzeSkeleton } from '../../common';

export default function MetabolicContextView({ patientId, onRunAssessment }) {
  const params = useParams();
  const navigate = useNavigate();
  const {
    biomarkers,
    updateBiomarker,
    runAssessment,
    isAnalyzing,
    isCaseLoading,
    activePatientId,
    setIsNewCaseModalOpen,
  } = usePatientContext();

  const effectivePatientId = patientId || params.patientId || activePatientId || null;

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
    if (!effectivePatientId) return;
    await runAssessment(effectivePatientId, biomarkers);
    navigate(`/patients/${effectivePatientId}/assessment`);
  });

  if (isCaseLoading || isAnalyzing) {
    return <MetabolicAnalyzeSkeleton />;
  }

  if (!effectivePatientId || !biomarkers) {
    return (
      <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50/40 rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 animate-fade-in">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-blue-100 text-blue-600 ring-8 ring-blue-50/80 shadow-inner">
            <FlaskConical size={32} />
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            No Biomarker Profile Loaded
          </h3>
          <p className="text-slate-600 text-xs sm:text-sm sm:text-base leading-relaxed">
            The workspace has been reset. To review patient-specific endocrine biomarkers, serum calcium homeostasis, and turnover kinetics, choose an option below:
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
                Input demographics and laboratory blood tests to run automated endocrine evaluations.
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
                Select an existing patient profile from your dashboard to view and modify their metabolic panel.
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

  const getStatusBadge = (key) => {
    const data = biomarkers[key];
    if (!data || data.value === '' || data.value === null || data.value === undefined) {
      return <span className="w-12 inline-block" />;
    }
    const status = data.status || 'normal';
    if (status === 'elevated' || status === 'high') {
      return <span className="w-12 text-xs font-semibold text-red-600 pl-1">High</span>;
    }
    if (status === 'low' || status === 'deficient') {
      return <span className="w-12 text-xs font-semibold text-amber-800 pl-1">Low</span>;
    }
    return <span className="w-12 inline-block" />;
  };

  const getBorderColor = (key) => {
    const data = biomarkers[key];
    if (!data || data.value === '' || data.value === null || data.value === undefined) {
      return 'border-slate-200 bg-slate-50/40';
    }
    const status = data.status || 'normal';
    if (status === 'elevated' || status === 'high') return 'border-red-400 bg-red-50/20';
    if (status === 'low' || status === 'deficient') return 'border-amber-400 bg-amber-50/20';
    return 'border-slate-200 bg-slate-50/40';
  };

  const abnormalCount = Object.entries(biomarkers).filter(
    ([_, v]) => typeof v === 'object' && v.status && v.status !== 'normal'
  ).length;

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 min-w-0">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Endocrine Biomarker Input</h2>
          <p className="text-slate-600 mt-0.5 sm:mt-1 text-xs sm:text-sm lg:text-base">
            Enter recent lab results to update patient risk profile and 3D simulation.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div
            className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border ${
              abnormalCount > 0 ? 'bg-red-50 border-red-200 text-red-700' : 'bg-teal-50 border-teal-200 text-teal-700'
            }`}
          >
            <AlertTriangle size={15} className={abnormalCount > 0 ? 'text-red-600' : 'text-teal-600'} />
            <span className="font-bold text-xs">
              {abnormalCount} Out-of-Range {abnormalCount === 1 ? 'Biomarker' : 'Biomarkers'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid — matching user reference screenshot */}
      <div className="grid lg:grid-cols-5 gap-5 sm:gap-6 min-w-0">
        
        {/* Left Card: Bone Metabolism Panel (3 Cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-sm min-w-0">
          <div className="flex items-center gap-2.5 pb-3 sm:pb-4 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
              <FlaskConical size={18} />
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Bone Metabolism Panel</h3>
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
                <div className={`flex items-center border rounded-2xl overflow-hidden transition ${getBorderColor('pth')}`}>
                  <input
                    type="number"
                    step="0.1"
                    value={biomarkers.pth?.value ?? ''}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'pth', e.target.value)}
                    className="w-24 pl-4 pr-1 py-2 text-sm font-semibold text-slate-800 bg-transparent focus:outline-none text-right"
                  />
                  <span className="px-3 py-2 text-slate-400 font-medium text-xs">
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
                <div className={`flex items-center border rounded-2xl overflow-hidden transition ${getBorderColor('vitaminD')}`}>
                  <input
                    type="number"
                    step="0.1"
                    value={biomarkers.vitaminD?.value ?? ''}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'vitaminD', e.target.value)}
                    className="w-24 pl-4 pr-1 py-2 text-sm font-semibold text-slate-800 bg-transparent focus:outline-none text-right"
                  />
                  <span className="px-3 py-2 text-slate-400 font-medium text-xs">
                    ng/mL
                  </span>
                </div>
                {getStatusBadge('vitaminD')}
              </div>
            </div>

            {/* Total Calcium */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold min-w-[200px]">
                <span>Total Calcium</span>
                <span title="NHANES LBXSCA (Ref: 8.6–10.3 mg/dL)" className="text-slate-400 hover:text-slate-600 cursor-help">
                  <Info size={14} />
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-1 justify-end">
                <div className={`flex items-center border rounded-2xl overflow-hidden transition ${getBorderColor('calcium')}`}>
                  <input
                    type="number"
                    step="0.1"
                    value={biomarkers.calcium?.value ?? ''}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'calcium', e.target.value)}
                    className="w-24 pl-4 pr-1 py-2 text-sm font-semibold text-slate-800 bg-transparent focus:outline-none text-right"
                  />
                  <span className="px-3 py-2 text-slate-400 font-medium text-xs">
                    mg/dL
                  </span>
                </div>
                {getStatusBadge('calcium')}
              </div>
            </div>

            {/* Total Phosphate */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-1.5 text-slate-800 font-bold min-w-[200px]">
                <span>Total Phosphate</span>
                <span title="NHANES LBXSPH (Ref: 2.5–4.5 mg/dL)" className="text-slate-400 hover:text-slate-600 cursor-help">
                  <Info size={14} />
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-1 justify-end">
                <div className={`flex items-center border rounded-2xl overflow-hidden transition ${getBorderColor('phosphate')}`}>
                  <input
                    type="number"
                    step="0.1"
                    value={biomarkers.phosphate?.value ?? ''}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'phosphate', e.target.value)}
                    className="w-24 pl-4 pr-1 py-2 text-sm font-semibold text-slate-800 bg-transparent focus:outline-none text-right"
                  />
                  <span className="px-3 py-2 text-slate-400 font-medium text-xs">
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
                <div className={`flex items-center border rounded-2xl overflow-hidden transition ${getBorderColor('alp')}`}>
                  <input
                    type="number"
                    step="1"
                    value={biomarkers.alp?.value ?? ''}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'alp', e.target.value)}
                    className="w-24 pl-4 pr-1 py-2 text-sm font-semibold text-slate-800 bg-transparent focus:outline-none text-right"
                  />
                  <span className="px-3 py-2 text-slate-400 font-medium text-xs">
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
                <div className={`flex items-center border rounded-2xl overflow-hidden transition ${getBorderColor('ctx')}`}>
                  <input
                    type="number"
                    step="10"
                    value={biomarkers.ctx?.value ?? ''}
                    onChange={(e) => updateBiomarker(effectivePatientId, 'ctx', e.target.value)}
                    className="w-24 pl-4 pr-1 py-2 text-sm font-semibold text-slate-800 bg-transparent focus:outline-none text-right"
                  />
                  <span className="px-3 py-2 text-slate-400 font-medium text-xs">
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
                {!isInputValid ? (
                  <span className="text-amber-600 font-semibold flex items-center gap-1">
                    <AlertTriangle size={12} className="shrink-0" />
                    Some values are empty — defaults will be applied if analyzed now.
                  </span>
                ) : (
                  'Ensure all out-of-range values are verified before proceeding to analysis.'
                )}
              </p>

              <button
                onClick={handleRunAssessment}
                disabled={isAnalyzing}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-950 hover:to-indigo-950 text-white shadow-blue-900/20 cursor-pointer disabled:opacity-50"
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

