import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Search, Calendar, UserRound, LogOut, X, ChevronRight } from 'lucide-react';
import { usePatientContext } from '../../context/PatientDataContext';
import { clearAuthSession, readStoredDoctorProfile } from '../../services';

export default function TopBar({ onSelectPatient }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const searchRef = useRef(null);
  const { patients, setActivePatientId, activePatientId, isLoadingPatients } = usePatientContext();
  const currentPatientId = params.patientId || activePatientId || (patients[0]?.id ?? 'PEB-8842-A');
  const doctorProfile = readStoredDoctorProfile();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const patient = useMemo(() => {
    return patients.find((p) => p.id === currentPatientId) || patients[0];
  }, [patients, currentPatientId]);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return patients.filter((p) =>
      p.id?.toLowerCase().includes(term) ||
      p.name?.toLowerCase().includes(term) ||
      p.mrn?.toLowerCase().includes(term) ||
      p.procedure?.toLowerCase().includes(term) ||
      p.condition?.toLowerCase().includes(term)
    );
  }, [patients, searchTerm]);

  // Click outside search dismiss
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCurrentTab = () => {
    const p = location.pathname;
    if (p.includes('/metabolic')) return 'metabolic';
    if (p.includes('/assessment')) return 'assessment';
    if (p.includes('/planning')) return 'planning';
    if (p.includes('/summary')) return 'summary';
    return 'metabolic';
  };

  const handlePatientChange = (newPatientId) => {
    setActivePatientId(newPatientId);
    if (onSelectPatient) {
      onSelectPatient(newPatientId);
    }
    const tab = getCurrentTab();
    navigate(`/patients/${newPatientId}/${tab}`);
    setIsSearchFocused(false);
    setSearchTerm('');
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate('/login', { replace: true });
  };

  const doctorName = doctorProfile
    ? `Dr. ${doctorProfile.firstName || ''} ${doctorProfile.lastName || ''}`.trim()
    : 'Dr. User';

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-3 flex items-center justify-between sticky top-0 z-30">
      <div ref={searchRef} className="relative flex-1 max-w-lg">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          placeholder="Search patient IDs, names, or conditions..."
          className="w-full pl-11 pr-10 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
          >
            <X size={15} />
          </button>
        )}

        {/* Live Search Results Dropdown */}
        {isSearchFocused && searchTerm.trim().length > 0 && (
          <div className="absolute  left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Search Results</span>
              <span>{searchResults.length} {searchResults.length === 1 ? 'case' : 'cases'}</span>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-medium">
                  No matching patients found for &ldquo;{searchTerm}&rdquo;
                </div>
              ) : (
                searchResults.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handlePatientChange(p.id)}
                    className="w-full p-3.5 flex items-center justify-between hover:bg-blue-50/60 transition text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                        {p.gender === 'Female' ? 'F' : 'M'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                            {p.name}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-600">
                            {p.id}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          {p.procedure || p.condition} • {p.age} yrs
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex mx-2 items-center gap-5">
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

        <div className="flex items-center gap-2">
          <label htmlFor="patient-selector" className="text-xs font-bold text-slate-400 hidden sm:block">
            Case:
          </label>
          <select
            id="patient-selector"
            value={currentPatientId}
            onChange={(e) => handlePatientChange(e.target.value)}
            disabled={isLoadingPatients && patients.length === 0}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 shadow-sm cursor-pointer"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} - {p.name}
              </option>
            ))}
          </select>
        </div>
{/* 
        <button className="relative w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition">
          <Bell size={18} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
        </button> */}

        <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
            <UserRound size={18} />
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-sm font-semibold text-slate-900">{doctorName}</span>
            <span className="text-xs text-slate-500">{doctorProfile?.institution || 'Orthopedic Specialist'}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
            title="Logout"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
