import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import WorkflowStepper from './WorkflowStepper';
import { NewCaseModal } from '../common';
import { usePatientContext } from '../../context/PatientDataContext';

export default function MainLayout() {
  const location = useLocation();
  const { apiError, clearApiError } = usePatientContext();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-x-hidden">
      <div className="print:hidden">
        <Sidebar
          isMobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 w-full overflow-hidden print:overflow-visible">
        <div className="print:hidden">
          <TopBar onToggleMobileMenu={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
          <WorkflowStepper />
        </div>

        {apiError && (
          <div className="mx-3.5 sm:mx-6 lg:mx-8 mt-4 p-3.5 sm:p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-red-900 truncate">
                  Backend Service Alert: <span className="font-medium text-red-700">{apiError}</span>
                </p>
                <p className="text-[11px] sm:text-xs text-red-600 font-medium hidden sm:block">
                  Local offline clinical decision rule engine is actively handling assessment and planning.
                </p>
              </div>
            </div>
            <button
              onClick={clearApiError}
              aria-label="Dismiss alert"
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 hover:text-red-700 transition shrink-0"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <main className="flex-1 p-3.5 sm:p-5 lg:p-8 min-w-0 max-w-full overflow-x-hidden print:overflow-visible print:p-0">
          <Outlet />
        </main>
      </div>

      <NewCaseModal />
    </div>
  );
}

