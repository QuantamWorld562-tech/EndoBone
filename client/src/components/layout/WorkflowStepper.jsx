import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { STEP_LABELS } from '../../utils/constants';
import { usePatientContext } from '../../context/PatientDataContext';

const TAB_BREADCRUMB_MAP = {
  dashboard: 'Dashboard',
  metabolic: 'Metabolic Context',
  assessment: 'AI Assessment',
  planning: '3D Planning',
  summary: 'Pre-Surgical Summary',
};

export default function WorkflowStepper({ onSelectStep }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { activePatientId } = usePatientContext();
  const patientId = params.patientId || activePatientId || null;

  const getActiveTab = () => {
    const p = location.pathname;
    if (p.includes('/metabolic')) return 'metabolic';
    if (p.includes('/assessment')) return 'assessment';
    if (p.includes('/planning')) return 'planning';
    if (p.includes('/summary')) return 'summary';
    if (p.includes('/dashboard')) return 'dashboard';
    return 'dashboard';
  };

  const activeTab = getActiveTab();
  const currentStepIndex = STEP_LABELS.findIndex((s) => s.tab === activeTab);
  const currentStep = currentStepIndex >= 0 ? currentStepIndex : 0;
  const currentLabel = TAB_BREADCRUMB_MAP[activeTab] || 'Workspace';

  const handleStepClick = (step) => {
    if (onSelectStep) {
      onSelectStep(step.tab);
    }
    navigate(step.path(patientId));
  };

  return (
    <div className="px-3.5 sm:px-6 lg:px-8 pt-3 sm:pt-5 pb-2 bg-gradient-to-b from-blue-50/40 to-slate-50 border-b border-slate-200 min-w-0 max-w-full">
      <div className="flex items-center justify-between mb-2.5 sm:mb-3.5 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm min-w-0 truncate">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-blue-600 font-medium transition-colors shrink-0 cursor-pointer"
          >
            Clinical Workspace
          </button>
          <span className="text-slate-300 shrink-0">/</span>
          <span className="font-black text-slate-900 truncate">{currentLabel}</span>
          {patientId ? (
            <>
              <span className="text-slate-300 shrink-0">/</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-lg text-[10px] sm:text-xs shrink-0">
                {patientId}
              </span>
            </>
          ) : (
            <>
              <span className="text-slate-300 shrink-0">/</span>
              <span className="font-medium text-slate-400 bg-slate-100 px-1.5 py-0.2 sm:px-2 sm:py-0.5 rounded-lg text-[10px] sm:text-xs shrink-0">
                No Active Case
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 scrollbar-none select-none">
        {STEP_LABELS.map((step, i) => {
          const active = currentStep === i;
          const done = currentStep > i;
          return (
            <div key={step.tab} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => handleStepClick(step)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl transition-all text-xs sm:text-sm cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/20 font-bold'
                    : done
                    ? 'bg-emerald-50 text-emerald-700 font-bold ring-1 ring-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-500 hover:bg-slate-100 font-semibold ring-1 ring-slate-200'
                }`}
              >
                <span
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-[11px] font-black shrink-0 ${
                    active
                      ? 'bg-white/20 text-white'
                      : done
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {done ? '✓' : step.short}
                </span>
                <span className="truncate">{step.label}</span>
              </button>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`w-4 sm:w-6 h-0.5 rounded-full flex-shrink-0 ${
                    done ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
