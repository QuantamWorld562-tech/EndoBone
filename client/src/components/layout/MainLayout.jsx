import { useEffect } from 'react';
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <WorkflowStepper />

        {apiError && (
          <div className="mx-8 mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">
                  Backend Service Alert: <span className="font-medium text-red-700">{apiError}</span>
                </p>
                <p className="text-xs text-red-600 font-medium">
                  Local offline clinical decision rule engine is actively handling assessment and planning.
                </p>
              </div>
            </div>
            <button
              onClick={clearApiError}
              aria-label="Dismiss alert"
              className="p-1.5 rounded-lg text-red-500 hover:bg-red-100 hover:text-red-700 transition"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <main className="flex-1 p-8 overflow-x-hidden scrollbar-hidden">
          <Outlet />
        </main>
      </div>

      <NewCaseModal />
    </div>
  );
}

