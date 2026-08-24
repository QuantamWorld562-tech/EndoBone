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
  Shield,
  ShieldCheck,
  UserRound,
  Sparkles,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { usePatientContext } from '../../context/PatientDataContext';
import { readStoredDoctorProfile, clearAuthSession } from '../../services';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: () => '/dashboard', badge: null },
  { id: 'metabolic', label: 'Metabolic Context', icon: Activity, path: (pid) => pid ? `/patients/${pid}/metabolic` : '/metabolic', badge: null },
  { id: 'assessment', label: 'AI Assessment', icon: BrainCircuit, path: (pid) => pid ? `/patients/${pid}/assessment` : '/assessment', badge: 'AI' },
  { id: 'planning', label: '3D Planning', icon: Box, path: (pid) => pid ? `/patients/${pid}/planning` : '/planning', badge: '3D' },
  { id: 'summary', label: 'Pre-Surgical Summary', icon: FileText, path: (pid) => pid ? `/patients/${pid}/summary` : '/summary', badge: null },
];

export default function Sidebar({ onNewCase, isMobileOpen, onCloseMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const {
    activePatientId,
    setIsNewCaseModalOpen,
    setIsSettingsModalOpen,
    setIsSupportModalOpen,
  } = usePatientContext();
  const patientId = params.patientId || activePatientId || null;
  const currentDoctor = readStoredDoctorProfile();
  const isAdmin = currentDoctor?.role === 'admin';

  const getActiveTab = () => {
    const pathname = location.pathname;
    if (pathname.includes('/admin')) return 'admin';
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

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login', { replace: true });
    onCloseMobile?.();
  };

  const doctorName = currentDoctor
    ? `${currentDoctor.firstName || ''} ${currentDoctor.lastName || ''}`.trim()
    : 'Clinical User';

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar Container: Fixed slide-over on mobile, full-height sticky flexbox on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 lg:w-64 bg-white border-r border-slate-200 shadow-2xl lg:shadow-none flex flex-col h-screen max-h-screen transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header — Aligned with TopBar height */}
        <div className="h-16 px-4 sm:px-5 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <button
            onClick={() => { navigate('/'); onCloseMobile?.(); }}
            className="flex items-center gap-3 text-left group min-w-0 cursor-pointer"
          >
            <div className="w-11 h-11 rounded-xl  flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
              <img src="/logo2.png" alt="EndoBone AI" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-slate-900 text-base leading-tight group-hover:text-blue-600 transition-colors truncate">
                EndoBone AI
              </h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                Precision Surgical AI
              </p>
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

        {/* Action Shortcut: New Patient Case */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <button
            onClick={handleCreateNewCase}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition cursor-pointer group"
          >
            <Plus size={15} className="group-hover:rotate-90 transition-transform duration-200" />
            <span>New Patient Case</span>
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
          <div className="px-3 pt-1 pb-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            Clinical Workspace
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between group cursor-pointer ${
                  isActive
                    ? 'bg-blue-50/90 text-blue-700 font-bold shadow-sm ring-1 ring-blue-600/10'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <item.icon
                    size={17}
                    className={`shrink-0 transition-colors ${
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span className="text-xs truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wide shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Dedicated Administration Section for Admins */}
          {isAdmin && (
            <div className="pt-3 mt-2 border-t border-slate-100">
              <div className="px-3 pb-1 text-[10px] font-black uppercase tracking-wider text-amber-800 flex items-center justify-between">
                <span>Administration</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              </div>
              <button
                onClick={() => { navigate('/admin'); onCloseMobile?.(); }}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between group cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-amber-50 text-amber-950 font-bold shadow-sm ring-1 ring-amber-500/20'
                    : 'text-slate-700 hover:bg-amber-50/60 font-semibold'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Shield
                    size={17}
                    className={`shrink-0 ${
                      activeTab === 'admin' ? 'text-amber-600' : 'text-amber-500 group-hover:text-amber-700'
                    }`}
                  />
                  <span className="text-xs truncate">Admin Control Panel</span>
                </div>
                <span className="bg-amber-200/80 text-amber-900 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                  Root
                </span>
              </button>
            </div>
          )}
        </nav>

        {/* Pinned Bottom Status & Utility Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 sticky bottom-0 bg-white space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setIsSettingsModalOpen(true); onCloseMobile?.(); }}
              className="p-2 sm:p-2.5 border border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Open Preferences & Security Settings"
            >
              <Settings size={15} />
              <span>Settings</span>
            </button>
            <button
              onClick={() => { setIsSupportModalOpen(true); onCloseMobile?.(); }}
              className="p-2 sm:p-2.5 border border-slate-200 text-slate-600 hover:bg-teal-50 hover:border-teal-200 hover:text-teal-700 rounded-xl transition flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer"
              title="Open Clinical Reference & Support"
            >
              <HelpCircle size={15} />
              <span>Support</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              v1.0 Online
            </span>
            <span className="text-slate-300">HIPAA Compliant</span>
          </div>
        </div>
      </aside>
    </>
  );
}
