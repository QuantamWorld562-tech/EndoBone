import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Search, Bell, Calendar, UserRound } from 'lucide-react';
import { patients } from '../../data/mockData';
import { usePatientData } from '../../hooks';

export default function TopBar({ onSelectPatient }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const currentPatientId = params.patientId || 'PEB-8842-A';

  const { patient } = usePatientData(currentPatientId);

  const getCurrentTab = () => {
    const p = location.pathname;
    if (p.includes('/metabolic')) return 'metabolic';
    if (p.includes('/assessment')) return 'assessment';
    if (p.includes('/planning')) return 'planning';
    if (p.includes('/summary')) return 'summary';
    return 'metabolic';
  };

  const handlePatientChange = (newPatientId) => {
    if (onSelectPatient) {
      onSelectPatient(newPatientId);
    }
    const tab = getCurrentTab();
    navigate(`/patients/${newPatientId}/${tab}`);
  };

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between sticky top-0 z-20">
      <div className="relative flex-1 max-w-lg">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search patient IDs, case numbers, or conditions..."
          className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
        />
      </div>

      <div className="flex items-center gap-5">
        {patient && (
          <div className="hidden lg:flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              {patient.gender === 'Female' ? 'F' : 'M'}
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-900">{patient.id}</span>
                <span className="text-xs text-slate-500">• {patient.age} yrs</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Calendar size={12} />
                <span>{patient.procedure || 'Case Active'}</span>
              </div>
            </div>
          </div>
        )}

        <select
          value={currentPatientId}
          onChange={(e) => handlePatientChange(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.id} - {p.name}
            </option>
          ))}
        </select>

        <button className="relative w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button>

        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <UserRound size={18} />
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-900">Dr. User</span>
            <span className="text-xs text-slate-500">Orthopedic Specialist</span>
          </div>
        </div>
      </div>
    </header>
  );
}
