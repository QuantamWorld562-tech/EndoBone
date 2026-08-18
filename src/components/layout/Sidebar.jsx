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
} from 'lucide-react';
import { usePatientContext } from '../../context/PatientDataContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: () => '/dashboard' },
  { id: 'metabolic', label: 'Metabolic Context', icon: Activity, path: (pid) => `/patients/${pid}/metabolic` },
  { id: 'assessment', label: 'AI Assessment', icon: BrainCircuit, path: (pid) => `/patients/${pid}/assessment` },
  { id: 'planning', label: '3D Planning', icon: Box, path: (pid) => `/patients/${pid}/planning` },
  { id: 'summary', label: 'Pre-Surgical Summary', icon: FileText, path: (pid) => `/patients/${pid}/summary` },
];

export default function Sidebar({ onNewCase }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const { activePatientId, setIsNewCaseModalOpen } = usePatientContext();
  const patientId = params.patientId || activePatientId || 'PEB-8842-A';

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
  };

  const handleCreateNewCase = () => {
    if (onNewCase) {
      onNewCase();
    } else {
      setIsNewCaseModalOpen(true);
    }
  };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col min-h-screen relative">
      <div className="p-6 border-b border-slate-200">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 text-left w-full group"
        >
            <div className="w-13 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform overflow-hidden">
              <img src="/logo2.png" alt="EndoBone AI" className="w-full h-full object-cover" />
            </div>
          <div>
            <h2 className="font-bold text-slate-900 text-lg leading-tight group-hover:text-blue-600 transition-colors">
              EndoBone AI
            </h2>
            <p className="text-xs text-slate-500 font-medium">Precision Diagnostics</p>
          </div>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item)}
              className={`w-full text-left px-4 py-3 rounded-xl transition flex items-center gap-3 group ${
                isActive
                  ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700 font-semibold shadow-sm'
                  : 'text-slate-700 hover:bg-slate-50 border-l-4 border-transparent'
              }`}
            >
              <item.icon
                size={20}
                className={isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}
              />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 space-y-3 border-t border-slate-100 sticky bottom-0 bg-white">
        <button
          onClick={handleCreateNewCase}
          className="w-full px-4 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
        >
          <Plus size={18} />
          New Case Analysis
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            className="p-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition flex items-center justify-center"
            title="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            className="p-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition flex items-center justify-center"
            title="Support"
          >
            <HelpCircle size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
