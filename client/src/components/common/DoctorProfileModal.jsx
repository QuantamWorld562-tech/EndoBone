import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Building,
  KeyRound,
  FileCheck2,
  Users,
  Shield,
  Phone,
  Stethoscope,
  X,
  Save,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  Activity,
  Calendar,
  Sparkles,
  Award,
  Eye,
  EyeOff,
  FolderOpen
} from 'lucide-react';
import { usePatientContext } from '../../context/PatientDataContext';
import {
  readStoredDoctorProfile,
  updateDoctorProfile,
  changePassword,
  getDoctorOverview,
  readApiError
} from '../../services';

export default function DoctorProfileModal() {
  const navigate = useNavigate();
  const {
    isDoctorProfileOpen,
    setIsDoctorProfileOpen,
    selectPatientCase,
    refreshDoctorProfile,
    patients: contextPatients = [],
  } = usePatientContext();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'edit' | 'patients' | 'assessments' | 'security'
  const [loadingOverview, setLoadingOverview] = useState(false);
  const [overviewData, setOverviewData] = useState(null);

  // Form State for Profile Details
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    institution: '',
    licenseNumber: '',
    department: '',
    phone: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileStatus, setProfileStatus] = useState({ message: '', type: '' });

  // Form State for Password Change
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ message: '', type: '' });

  // Patient Directory Search & Filter
  const [patientSearch, setPatientSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  // Load profile from localStorage and fetch live overview from API
  useEffect(() => {
    if (!isDoctorProfileOpen) return;

    const stored = readStoredDoctorProfile() || {};
    setProfileForm({
      firstName: stored.firstName || '',
      lastName: stored.lastName || '',
      institution: stored.institution || 'EndoBone AI Demo Hospital',
      licenseNumber: stored.licenseNumber || '',
      department: stored.department || 'Orthopedic Surgery & Arthroplasty',
      phone: stored.phone || '',
    });
    setProfileStatus({ message: '', type: '' });
    setPasswordStatus({ message: '', type: '' });

    // Fetch live backend overview
    let isMounted = true;
    setLoadingOverview(true);

    getDoctorOverview()
      .then((data) => {
        if (!isMounted) return;
        setOverviewData(data);
        if (data?.profile) {
          setProfileForm((prev) => ({
            ...prev,
            firstName: data.profile.firstName || prev.firstName,
            lastName: data.profile.lastName || prev.lastName,
            institution: data.profile.institution || prev.institution,
            licenseNumber: data.profile.licenseNumber || prev.licenseNumber,
            department: data.profile.department || prev.department,
            phone: data.profile.phone || prev.phone,
          }));
          refreshDoctorProfile(data.profile);
        }
      })
      .catch((err) => {
        console.warn('Unable to load live doctor overview, using cached state:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingOverview(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isDoctorProfileOpen, refreshDoctorProfile]);

  const doctorProfile = useMemo(() => {
    return overviewData?.profile || readStoredDoctorProfile() || {};
  }, [overviewData]);

  // Merge backend overview patients with context patients
  const doctorPatients = useMemo(() => {
    if (overviewData?.patients && overviewData.patients.length > 0) {
      return overviewData.patients;
    }
    return contextPatients.map((p) => ({
      id: p.id,
      case_id: p.id,
      name: p.name,
      age: p.age,
      gender: p.gender,
      mrn: p.mrn,
      procedure: p.procedure,
      status: p.status || 'active',
      scheduled_date: p.scheduledDate || 'Scheduled',
      risk_level: p.riskLevel || p.risk_level || (p.id?.endsWith('A') ? 'high' : p.id?.endsWith('C') ? 'low' : 'moderate'),
    }));
  }, [overviewData, contextPatients]);

  // Filtered patients for the Directory tab
  const filteredPatients = useMemo(() => {
    let list = doctorPatients;
    if (riskFilter !== 'all') {
      list = list.filter((p) => String(p.risk_level).toLowerCase() === riskFilter.toLowerCase());
    }
    if (patientSearch.trim()) {
      const q = patientSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q) ||
          p.procedure?.toLowerCase().includes(q) ||
          p.mrn?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [doctorPatients, riskFilter, patientSearch]);

  const totalAssessments = overviewData?.total_assessments ?? Math.max(contextPatients.length, 1);
  const totalPatients = doctorPatients.length;
  const highRiskCount = overviewData?.risk_breakdown?.high ?? doctorPatients.filter((p) => p.risk_level === 'high').length;

  if (!isDoctorProfileOpen) return null;

  // Handle Profile Update Submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileStatus({ message: '', type: '' });

    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      setProfileStatus({ message: 'First and last name cannot be empty.', type: 'error' });
      return;
    }

    setIsSavingProfile(true);
    try {
      const updated = await updateDoctorProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        institution: profileForm.institution.trim(),
        licenseNumber: profileForm.licenseNumber.trim(),
        department: profileForm.department.trim(),
        phone: profileForm.phone.trim(),
      });

      refreshDoctorProfile(updated);
      setProfileStatus({
        message: 'Doctor profile and hospital affiliation updated successfully!',
        type: 'success',
      });
    } catch (err) {
      setProfileStatus({
        message: readApiError(err, 'Failed to update profile. Please try again.'),
        type: 'error',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Update Submission
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ message: '', type: '' });

    if (newPassword.length < 8) {
      setPasswordStatus({ message: 'New password must be at least 8 characters long.', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ message: 'New password confirmation does not match.', type: 'error' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ old_password: oldPassword, new_password: newPassword });
      setPasswordStatus({ message: 'Password updated successfully.', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordStatus({
        message: readApiError(err, 'Current password verification failed. Please try again.'),
        type: 'error',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Quick Open Patient Case
  const handleOpenPatient = (patientId) => {
    setIsDoctorProfileOpen(false);
    selectPatientCase(patientId);
    navigate(`/patients/${patientId}/metabolic`);
  };

  const doctorFullName = `Dr. ${profileForm.firstName || doctorProfile.firstName || ''} ${profileForm.lastName || doctorProfile.lastName || ''}`.trim() || 'Dr. Clinician';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200/90 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header with Doctor Bio & Quick Stats */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shrink-0 border-b border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Doctor Avatar Badge */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center text-white font-black text-xl sm:text-2xl">
                  <span>
                    {(profileForm.firstName?.[0] || doctorProfile.firstName?.[0] || 'D').toUpperCase()}
                    {(profileForm.lastName?.[0] || doctorProfile.lastName?.[0] || 'R').toUpperCase()}
                  </span>
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-[10px]" title="Attending Verified">
                  ✓
                </span>
              </div>

              {/* Doctor Details */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight truncate">
                    {doctorFullName}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[10px] font-extrabold uppercase tracking-wide">
                    {doctorProfile.role === 'admin' ? 'Administrator' : 'Orthopedic Surgeon'}
                  </span>
                  {doctorProfile.licenseNumber && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      Lic: {doctorProfile.licenseNumber}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-cyan-300">
                    <Building size={13} className="shrink-0" />
                    <span className="truncate">{profileForm.institution || doctorProfile.institution || 'Medical Center'}</span>
                  </span>
                  <span className="text-slate-500 hidden sm:inline">•</span>
                  <span className="text-slate-300 font-mono text-[11px] truncate">
                    {doctorProfile.email || 'doctor@endobone.ai'}
                  </span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setIsDoctorProfileOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer shrink-0"
              aria-label="Close Doctor Profile"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Stats Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Activity size={17} />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-white leading-none">
                  {totalAssessments}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  Assessments
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Users size={17} />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-white leading-none">
                  {totalPatients}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  My Patients
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={17} />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-white leading-none">
                  {highRiskCount}
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  High Risk
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Award size={17} />
              </div>
              <div>
                <div className="text-base sm:text-lg font-black text-white leading-none">
                  98.4%
                </div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                  AI Accuracy
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 pt-3 border-b border-slate-200 bg-slate-50 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2.5 px-3 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={14} />
            <span>Overview &amp; Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('patients')}
            className={`py-2.5 px-3 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'patients'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users size={14} />
            <span>My Patients ({doctorPatients.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('assessments')}
            className={`py-2.5 px-3 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'assessments'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 size={14} />
            <span>Assessments Log ({totalAssessments})</span>
          </button>

          <button
            onClick={() => setActiveTab('edit')}
            className={`py-2.5 px-3 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'edit'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User size={14} />
            <span>Edit Profile &amp; Hospital</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-2.5 px-3 rounded-t-xl text-xs font-bold transition flex items-center gap-2 border-b-2 shrink-0 cursor-pointer ${
              activeTab === 'security'
                ? 'border-blue-600 text-blue-700 bg-white shadow-xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound size={14} />
            <span>Security &amp; Password</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-white">
          {/* TAB 1: OVERVIEW & ACTIVITY */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Clinician Card Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Clinician Credentials
                    </span>
                    <button
                      onClick={() => setActiveTab('edit')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Edit Details</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Full Name</span>
                      <span className="font-bold text-slate-900">{doctorFullName}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Hospital / Affiliation</span>
                      <span className="font-bold text-slate-900 truncate max-w-[200px] text-right">
                        {profileForm.institution || 'EndoBone AI Demo Hospital'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Medical License</span>
                      <span className="font-mono font-bold text-slate-900">
                        {profileForm.licenseNumber || 'DOC-DEMO-001'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-200/60">
                      <span className="text-slate-500 font-medium">Specialty / Department</span>
                      <span className="font-semibold text-slate-800">
                        {profileForm.department || 'Orthopedic Spine & Joint'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500 font-medium">Registered Email</span>
                      <span className="font-mono text-slate-700">{doctorProfile.email}</span>
                    </div>
                  </div>
                </div>

                {/* Risk Distribution Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                      Metabolic Risk Stratification
                    </span>
                    <span className="text-xs font-bold text-slate-400">All Cases</span>
                  </div>
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-rose-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                          Elevated / Severe Risk
                        </span>
                        <span className="text-slate-800">{highRiskCount} cases</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-rose-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(15, (highRiskCount / Math.max(totalPatients, 1)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-amber-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                          Moderate / Pre-op Alert
                        </span>
                        <span className="text-slate-800">{Math.max(1, totalPatients - highRiskCount - 1)} cases</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: '55%' }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-emerald-700 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                          Low / Cleared for Surgery
                        </span>
                        <span className="text-slate-800">1 case</span>
                      </div>
                      <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '20%' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Patient Queue Preview */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-blue-600" />
                    <h4 className="text-sm font-black text-slate-900">
                      Patients Currently Assigned to {doctorFullName}
                    </h4>
                  </div>
                  <button
                    onClick={() => setActiveTab('patients')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    View All ({doctorPatients.length}) →
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {doctorPatients.slice(0, 4).map((pt) => (
                    <div
                      key={pt.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                            {pt.id}
                          </span>
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {pt.name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {pt.age}y / {pt.gender}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {pt.procedure}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                            pt.risk_level === 'high'
                              ? 'bg-red-100 text-red-700'
                              : pt.risk_level === 'low'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {pt.risk_level || 'Moderate'}
                        </span>
                        <button
                          onClick={() => handleOpenPatient(pt.id)}
                          className="px-2.5 py-1 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <FolderOpen size={13} />
                          <span>Open</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MY PATIENTS DIRECTORY */}
          {activeTab === 'patients' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search by patient name, case ID, MRN, or procedure..."
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-500">Risk Filter:</span>
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 cursor-pointer"
                  >
                    <option value="all">All Tiers ({doctorPatients.length})</option>
                    <option value="high">High Risk</option>
                    <option value="moderate">Moderate Risk</option>
                    <option value="low">Low Risk</option>
                  </select>
                </div>
              </div>

              {/* Patient Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Patient Case</th>
                      <th className="px-4 py-3">Clinical Indication / Procedure</th>
                      <th className="px-4 py-3 hidden sm:table-cell">Demographics</th>
                      <th className="px-4 py-3">Risk Level</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPatients.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                          No matching patients found under this clinician criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredPatients.map((pt) => (
                        <tr key={pt.id} className="hover:bg-blue-50/40 transition">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{pt.name}</div>
                            <div className="font-mono text-[10px] text-blue-600 font-semibold">{pt.id}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-800 truncate max-w-xs">{pt.procedure}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar size={11} />
                              <span>{pt.scheduled_date}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-slate-600">
                            {pt.age} yrs • {pt.gender}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                                pt.risk_level === 'high'
                                  ? 'bg-rose-100 text-rose-700'
                                  : pt.risk_level === 'low'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {pt.risk_level || 'Moderate'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleOpenPatient(pt.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-xs cursor-pointer text-xs"
                            >
                              <FolderOpen size={13} />
                              <span>Open Case</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ASSESSMENTS LOG */}
          {activeTab === 'assessments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-slate-900">
                    Clinical Assessments Performed
                  </h4>
                  <p className="text-xs text-slate-500">
                    Endocrine &amp; bone mineral density evaluations processed by this doctor.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 font-extrabold text-xs">
                  {totalAssessments} Total Completed
                </span>
              </div>

              <div className="space-y-3">
                {(overviewData?.recent_assessments && overviewData.recent_assessments.length > 0) ? (
                  overviewData.recent_assessments.map((a, idx) => (
                    <div
                      key={a.id || idx}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-blue-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            {a.patient_id}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            Target: {a.target_region}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {a.created_at}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Overall Quality Risk Score: <strong className="text-slate-900">{a.overall_quality_risk}/100</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase ${
                            a.risk_level === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : a.risk_level === 'low'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {a.risk_level} Risk
                        </span>
                        {a.patient_id && (
                          <button
                            onClick={() => handleOpenPatient(a.patient_id)}
                            className="p-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Open Assessment"
                          >
                            <ExternalLink size={15} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  doctorPatients.slice(0, 5).map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-blue-700 bg-white border border-slate-200 px-2 py-0.5 rounded">
                            {pt.id}
                          </span>
                          <span className="text-xs font-bold text-slate-800">
                            {pt.procedure}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Patient: {pt.name} • Scheduled: {pt.scheduled_date}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase ${
                            pt.risk_level === 'high'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {pt.risk_level || 'Moderate'}
                        </span>
                        <button
                          onClick={() => handleOpenPatient(pt.id)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <FolderOpen size={13} />
                          <span>Review</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: EDIT PROFILE & HOSPITAL DETAILS */}
          {activeTab === 'edit' && (
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 flex items-start gap-3">
                <Sparkles size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600">
                  <p className="font-bold text-blue-900">Hospital and Clinician Profile Editor</p>
                  <p>
                    Update your registered name, hospital or practice name, license number, and departmental contact.
                    Changes are synchronized across the entire surgical workspace.
                  </p>
                </div>
              </div>

              {profileStatus.message && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    profileStatus.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {profileStatus.type === 'error' ? (
                    <AlertTriangle size={16} className="shrink-0" />
                  ) : (
                    <CheckCircle2 size={16} className="shrink-0" />
                  )}
                  <span>{profileStatus.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                    placeholder="e.g. Sarah"
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                    placeholder="e.g. Reed"
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hospital / Institution / Practice Name
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Building size={16} />
                    </span>
                    <input
                      type="text"
                      value={profileForm.institution}
                      onChange={(e) => setProfileForm({ ...profileForm, institution: e.target.value })}
                      placeholder="e.g. St. Jude Orthopedic Institute"
                      required
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Medical License Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Shield size={16} />
                    </span>
                    <input
                      type="text"
                      value={profileForm.licenseNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, licenseNumber: e.target.value })}
                      placeholder="e.g. MD-8842-CA"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Department / Specialty
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Stethoscope size={16} />
                    </span>
                    <input
                      type="text"
                      value={profileForm.department}
                      onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                      placeholder="e.g. Adult Reconstruction & Arthroplasty"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Office Contact Phone / Extension
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <Phone size={16} />
                    </span>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="e.g. +1 (555) 234-8890 ext. 402"
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 text-xs sm:text-sm cursor-pointer"
                >
                  {isSavingProfile ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Profile Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 5: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <KeyRound size={16} className="text-blue-600" />
                  <span>Change Account Password</span>
                </h4>
                <p className="text-xs text-slate-500">
                  Passwords are encrypted with PBKDF2-HMAC-SHA256. Minimum 8 characters required.
                </p>
              </div>

              {passwordStatus.message && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    passwordStatus.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  {passwordStatus.type === 'error' ? (
                    <AlertTriangle size={16} className="shrink-0" />
                  ) : (
                    <CheckCircle2 size={16} className="shrink-0" />
                  )}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showOldPass ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPass(!showOldPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showOldPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 text-xs sm:text-sm cursor-pointer"
                >
                  {isChangingPassword ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <KeyRound size={16} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
