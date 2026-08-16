import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import WorkflowStepper from './WorkflowStepper';
import { NewCaseModal } from '../common';

export default function MainLayout() {
  const location = useLocation();

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

        <main className="flex-1 p-8 overflow-x-hidden scrollbar-thin">
          <Outlet />
        </main>
      </div>

      <NewCaseModal />
    </div>
  );
}
