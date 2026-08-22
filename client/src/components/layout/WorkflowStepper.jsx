import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { STEP_LABELS } from '../../utils/constants';

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
  const patientId = params.patientId || 'PEB-8842-A';

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
    <div className="px-8 pt-6 pb-2 bg-gradient-to-b from-blue-50/40 to-slate-50 border-b border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-blue-600 font-medium transition-colors"
          >
            Clinical Workspace
          </button>
          <span className="text-slate-300">/</span>
          <span className="font-black text-slate-900">{currentLabel}</span>
          {params.patientId && (
            <>
              <span className="text-slate-300">/</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg text-xs">
                {params.patientId}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-2">
        {STEP_LABELS.map((step, i) => {
          const active = currentStep === i;
          const done = currentStep > i;
          return (
            <div key={step.tab} className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleStepClick(step)}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-xl transition-all text-sm ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/20 font-bold'
                    : done
                    ? 'bg-emerald-50 text-emerald-700 font-bold ring-1 ring-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-slate-500 hover:bg-slate-100 font-semibold ring-1 ring-slate-200'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black ${
                    active
                      ? 'bg-white/20 text-white'
                      : done
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {done ? '✓' : step.short}
                </span>
                {step.label}
              </button>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`w-8 h-0.5 rounded-full flex-shrink-0 ${
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
