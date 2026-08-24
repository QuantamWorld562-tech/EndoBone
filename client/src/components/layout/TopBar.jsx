import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { Search, Calendar, UserRound, LogOut, X, ChevronRight, Menu } from 'lucide-react';
import { usePatientContext } from '../../context/PatientDataContext';
import { clearAuthSession, readStoredDoctorProfile } from '../../services';

export default function TopBar({ onSelectPatient, onToggleMobileMenu }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const searchRef = useRef(null);
  const { patients = [], setActivePatientId, activePatientId, isLoadingPatients } = usePatientContext();
  const currentPatientId = params.patientId || activePatientId || null;
  const doctorProfile = readStoredDoctorProfile();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const patient = useMemo(() => {
    if (!currentPatientId) return null;
    return patients.find((p) => p.id === currentPatientId) || null;
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
    <header className="bg-white border-b border-slate-200 px-3.5 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between sticky top-0 z-30 min-w-0 max-w-full">
      {/* Left: Mobile Menu Toggle & Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-lg min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="p-2 -ml-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 lg:hidden transition shrink-0 cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu size={18} />
        </button>

        <div ref={searchRef} className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            placeholder="Search patient, ID, or condition..."
            className="w-full pl-9 pr-8 py-2 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={14} />
            </button>
          )}

          {/* Live Search Results Dropdown */}
          {isSearchFocused && searchTerm.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
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
                      className="w-full p-3 flex items-center justify-between hover:bg-blue-50/60 transition text-left group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {p.gender === 'Female' ? 'F' : 'M'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {p.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 font-bold text-slate-600 shrink-0">
                              {p.id}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                            {p.procedure || p.condition} • {p.age} yrs
                          </p>
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0 ml-2" />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Controls: Patient Banner, Case Selector, Doctor Profile & Logout */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0 ml-2">
        {patient ? (
          <div className="hidden xl:flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {patient.gender === 'Female' ? 'F' : 'M'}
            </div>
            <div className="flex flex-col leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900">{patient.id}</span>
                <span className="text-[11px] text-slate-500">• {patient.age} yrs</span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <Calendar size={10} />
                <span className="truncate max-w-[100px]">{patient.procedure || 'Case Active'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-400 text-xs font-semibold">
            <UserRound size={14} />
            <span>No Case Active</span>
          </div>
        )}

        <div className="flex items-center gap-1 sm:gap-2">
          <label htmlFor="patient-selector" className="text-xs font-bold text-slate-400 hidden md:block">
            Case:
          </label>
          <select
            id="patient-selector"
            value={currentPatientId || ''}
            onChange={(e) => handlePatientChange(e.target.value)}
            disabled={isLoadingPatients && patients.length === 0}
            className="text-xs sm:text-sm border border-slate-200 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 shadow-sm cursor-pointer max-w-[120px] sm:max-w-[180px] truncate"
          >
            {!currentPatientId && (
              <option value="" disabled>
                Select Case...
              </option>
            )}
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} - {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <UserRound size={15} />
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-xs font-bold text-slate-900 truncate max-w-[110px]">{doctorName}</span>
            <span className="text-[10px] text-slate-500 truncate max-w-[110px]">{doctorProfile?.institution || 'Orthopedic Specialist'}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer flex items-center gap-1"
            title="Logout"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
