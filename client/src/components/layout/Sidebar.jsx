import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  BarChart3,
  Activity,
  Box,
  FileText,
  Settings,
  HelpCircle,
  Plus,
  BrainCircuit,
  X,
} from 'lucide-react';
import { usePatientContext } from '../../context/PatientDataContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: () => '/dashboard' },
  { id: 'metabolic', label: 'Metabolic Context', icon: Activity, path: (pid) => pid ? `/patients/${pid}/metabolic` : '/metabolic' },
  { id: 'assessment', label: 'AI Assessment', icon: BrainCircuit, path: (pid) => pid ? `/patients/${pid}/assessment` : '/assessment' },
  { id: 'planning', label: '3D Planning', icon: Box, path: (pid) => pid ? `/patients/${pid}/planning` : '/planning' },
  { id: 'summary', label: 'Pre-Surgical Summary', icon: FileText, path: (pid) => pid ? `/patients/${pid}/summary` : '/summary' },
];

export default function Sidebar({ onNewCase, isMobileOpen, onCloseMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { activePatientId, setIsNewCaseModalOpen } = usePatientContext();
  const patientId = params.patientId || activePatientId || null;

  const getActiveTab = () => {
    const pathname = location.pathname;
    if (pathname.includes('/metabolic')) return 'metabolic';
    if (pathname.includes('/assessment')) return 'assessment';
    if (pathname.includes('/planning')) return 'planning';
    if (pathname.includes('/summary')) return 'summary';
    if (pathname.includes('/dashboard')) return 'dashboard';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  const handleNavigate = (item) => {
    navigate(item.path(patientId));
    onCloseMobile?.();
  };

  const handleCreateNewCase = () => {
    if (onNewCase) {
      onNewCase();
    } else {
      setIsNewCaseModalOpen(true);
    }
    onCloseMobile?.();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Container: Fixed slide-over on mobile, static on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 lg:w-64 bg-white border-r border-slate-200 shadow-xl lg:shadow-sm flex flex-col min-h-screen transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <button
            onClick={() => { navigate('/'); onCloseMobile?.(); }}
            className="flex items-center gap-3 text-left group min-w-0"
          >
            <div className="w-11 h-10 sm:w-12 sm:h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
              <img src="/logo2.png" alt="EndoBone AI" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-base sm:text-lg leading-tight group-hover:text-blue-600 transition-colors truncate">
                EndoBone AI
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">Precision Diagnostics</p>
            </div>
          </button>

          {/* Close drawer button on mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden transition cursor-pointer"
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item)}
                className={`w-full text-left px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl transition flex items-center gap-3 group cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700 font-semibold shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50 border-l-4 border-transparent font-medium'
                }`}
              >
                <item.icon
                  size={18}
                  className={isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'}
                />
                <span className="text-xs sm:text-sm">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-3 sm:p-4 space-y-2.5 sm:space-y-3 border-t border-slate-100 sticky bottom-0 bg-white">
          <button
            onClick={handleCreateNewCase}
            className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 bg-blue-600 text-white text-xs sm:text-sm font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            New Case Analysis
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="p-2 sm:p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition flex items-center justify-center cursor-pointer"
              title="Settings"
            >
              <Settings size={16} />
            </button>
            <button
              className="p-2 sm:p-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition flex items-center justify-center cursor-pointer"
              title="Support"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
