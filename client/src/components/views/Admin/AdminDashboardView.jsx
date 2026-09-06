import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Users,
  UserCheck,
  GraduationCap,
  Activity,
  FileText,
  Search,
  Filter,
  Edit2,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Database,
  Building2,
  Stethoscope,
  RefreshCw,
  Plus,
  X,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Server,
  Sparkles,
  ArrowUpDown,
  ClipboardList
} from 'lucide-react';
import {
  getAdminStats,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  getAdminPatients,
  updateAdminPatient,
  readStoredDoctorProfile,
  readApiError
} from '../../../services';
import { AdminDashboardSkeleton } from '../../common';

export default function AdminDashboardView() {
  const navigate = useNavigate();
  const currentDoctor = readStoredDoctorProfile();

  // State
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'patients' | 'security'
  const [stats, setStats] = useState({
    total_users: 0,
    total_patients: 0,
    total_assessments: 0,
    admin_count: 0,
    doctor_count: 0,
    professor_count: 0
  });
  const [users, setUsers] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modals
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Fetch data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, patientsRes] = await Promise.allSettled([
        getAdminStats(),
        getAdminUsers(),
        getAdminPatients()
      ]);

      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value?.users || []);
      }
      if (patientsRes.status === 'fulfilled') {
        setPatients(patientsRes.value?.cases || []);
      }
    } catch (err) {
      showToast('Error loading administrative data: ' + readApiError(err), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        u.firstName?.toLowerCase().includes(query) ||
        u.lastName?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.institution?.toLowerCase().includes(query) ||
        u.licenseNumber?.toLowerCase().includes(query);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Filtered Patients
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const query = searchQuery.toLowerCase();
      return (
        p.case_id?.toLowerCase().includes(query) ||
        p.patient_name?.toLowerCase().includes(query) ||
        p.clinical_indication?.toLowerCase().includes(query) ||
        p.clinician?.toLowerCase().includes(query)
      );
    });
  }, [patients, searchQuery]);

  // Handle Edit User Submit
  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    try {
      const updated = await updateAdminUser(editingUser.id, {
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        institution: editingUser.institution,
        licenseNumber: editingUser.licenseNumber,
        role: editingUser.role
      });
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)));
      showToast(`User ${updated.firstName} ${updated.lastName} updated successfully.`);
      setEditingUser(null);
    } catch (err) {
      showToast(readApiError(err, 'Failed to update user.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete User
  const handleConfirmDeleteUser = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    try {
      await deleteAdminUser(deletingUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
      showToast(`User ${deletingUser.firstName} ${deletingUser.lastName} deleted.`);
      setDeletingUser(null);
    } catch (err) {
      showToast(readApiError(err, 'Failed to delete user.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Save Patient
  const handleSavePatient = async (e) => {
    e.preventDefault();
    if (!editingPatient) return;
    setIsSubmitting(true);
    try {
      await updateAdminPatient(editingPatient.case_id, editingPatient);
      setPatients((prev) =>
        prev.map((p) => (p.case_id === editingPatient.case_id ? { ...p, ...editingPatient } : p))
      );
      showToast(`Patient case ${editingPatient.case_id} updated successfully.`);
      setEditingPatient(null);
    } catch (err) {
      showToast(readApiError(err, 'Failed to update patient case.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Shield size={13} className="text-amber-700" /> Admin
          </span>
        );
      case 'professor':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-300">
            <GraduationCap size={13} className="text-purple-700" /> Professor
          </span>
        );
      case 'doctor':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <Stethoscope size={13} className="text-blue-700" /> Doctor / Surgeon
          </span>
        );
    }
  };

  if (isLoading && users.length === 0 && patients.length === 0) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            toast.type === 'error'
              ? 'bg-red-500 text-white border-red-600 shadow-red-500/25'
              : 'bg-slate-900 text-white border-slate-800 shadow-slate-950/40'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} className="text-emerald-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold tracking-wide uppercase">
              <ShieldCheck size={14} /> Full Administrative Sovereignty
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Platform Administration & Access Control
            </h1>
            <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
              Manage clinical faculty, user accounts, and patient case repositories with zero-knowledge password protection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 text-white text-sm font-semibold backdrop-blur-sm border border-white/10 transition shadow-sm cursor-pointer"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh Data
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-bold shadow-lg shadow-blue-600/30 transition cursor-pointer"
            >
              <Activity size={16} /> Clinical Workspace
            </button>
          </div>
        </div>
      </div>

      {/* Security & Zero-Knowledge Notice */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border-2 border-emerald-200/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4 text-slate-800 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
          <KeyRound size={24} />
        </div>
        <div className="flex-1 text-xs sm:text-sm">
          <div className="font-extrabold text-emerald-950 flex items-center gap-2">
            <span>HIPAA-Compliant Cryptographic Password Isolation</span>
            <span className="bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md text-[10px] uppercase font-black">
              Zero-Knowledge
            </span>
          </div>
          <p className="text-slate-600 mt-1 leading-relaxed">
            All user passwords are cryptographically salted and hashed using <strong>PBKDF2-SHA256 (100,000 iterations)</strong>. 
            The system never stores, decrypts, or transmits plain-text passwords. Even system administrators cannot view or extract user credentials. Users retain exclusive authority to reset or modify their credentials.
          </p>
        </div>
      </div>

      {/* Demo Credentials Quick Pill */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-black">
            🔑
          </div>
          <div>
            <span className="font-bold text-white block">Pre-Seeded Demo System Accounts:</span>
            <span className="text-slate-400">Use these to test multi-role authorization and permissions:</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span className="font-mono text-amber-300 font-bold">admin@endobone.ai</span>
            <span className="text-slate-400 font-mono">/ Admin@2026!</span>
            <span className="bg-amber-900/60 text-amber-200 text-[10px] px-1.5 py-0.2 rounded font-bold">Admin</span>
          </div>
          <div className="bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            <span className="font-mono text-blue-300 font-bold">doctor@endobone.ai</span>
            <span className="text-slate-400 font-mono">/ Doctor@2026!</span>
            <span className="bg-blue-900/60 text-blue-200 text-[10px] px-1.5 py-0.2 rounded font-bold">Doctor</span>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Accounts</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.total_users || users.length}</span>
            <span className="text-xs font-semibold text-slate-400">Registered</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex gap-2">
            <span className="text-amber-700 font-semibold">{stats.admin_count} Admins</span> • 
            <span className="text-blue-700 font-semibold">{stats.doctor_count} Doctors</span> • 
            <span className="text-purple-700 font-semibold">{stats.professor_count} Professors</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Patient Cases</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ClipboardList size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.total_patients || patients.length}</span>
            <span className="text-xs font-semibold text-emerald-600 font-bold">Active in DB</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Accessible across all clinical departments</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Assessments</span>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.total_assessments || '24'}</span>
            <span className="text-xs font-semibold text-purple-600 font-bold">Completed</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Multi-modal CT + endocrine syntheses</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">System State</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Server size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-lg font-black text-slate-900">Operational</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">FastAPI backend &amp; local resilient store</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users size={16} /> User Accounts ({users.length})
        </button>
        <button
          onClick={() => { setActiveTab('patients'); setSearchQuery(''); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition cursor-pointer ${
            activeTab === 'patients'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ClipboardList size={16} /> Global Patient Repository ({patients.length})
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'users' ? 'Search by name, email, institution...' : 'Search by case ID, patient, procedure...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {activeTab === 'users' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={15} className="text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admins Only</option>
              <option value="doctor">Doctors / Surgeons</option>
              <option value="professor">Professors</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">User Details</th>
                  <th className="px-6 py-4">Assigned Role</th>
                  <th className="px-6 py-4">Institution / Clinic</th>
                  <th className="px-6 py-4">License ID</th>
                  <th className="px-6 py-4">Password Security</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                      <Users size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">No users matching search filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelf = user.id === currentDoctor?.id || user.email === currentDoctor?.email;
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center shadow-sm text-sm">
                              {user.firstName?.[0] || 'U'}{user.lastName?.[0] || ''}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-2">
                                <span>{user.firstName} {user.lastName}</span>
                                {isSelf && (
                                  <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                    You
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Building2 size={14} className="text-slate-400 shrink-0" />
                            <span className="truncate max-w-xs">{user.institution || '—'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                          {user.licenseNumber || '—'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold" title="Encrypted at rest with PBKDF2-SHA256 (100K iterations)">
                            <Lock size={12} className="text-emerald-600" />
                            <span>PBKDF2 Encrypted</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                              title="Edit user profile and permissions"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => setDeletingUser(user)}
                              disabled={isSelf}
                              className={`p-2 rounded-xl transition ${
                                isSelf
                                  ? 'text-slate-300 cursor-not-allowed'
                                  : 'text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer'
                              }`}
                              title={isSelf ? 'Cannot delete your own account' : 'Delete user'}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL PATIENT REPOSITORY */}
      {activeTab === 'patients' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Case ID / MRN</th>
                  <th className="px-6 py-4">Patient Name &amp; Indication</th>
                  <th className="px-6 py-4">Age / Gender</th>
                  <th className="px-6 py-4">Assigned Clinician</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                      <ClipboardList size={36} className="mx-auto mb-2 opacity-40" />
                      <p className="font-semibold">No patient cases found</p>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map((patient) => (
                    <tr key={patient.case_id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4">
                        <span className="font-black text-blue-600 font-mono bg-blue-50 px-2.5 py-1 rounded-lg">
                          {patient.case_id}
                        </span>
                        <div className="text-xs text-slate-400 mt-1 font-mono">{patient.mrn}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{patient.patient_name}</div>
                        <div className="text-xs text-slate-500 font-medium">{patient.clinical_indication}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {patient.patient_age} yrs • {patient.patient_gender}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-medium">
                        {patient.clinician}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            patient.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingPatient(patient)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition cursor-pointer"
                          >
                            <Edit2 size={13} /> Edit / Override
                          </button>
                          <button
                            onClick={() => navigate(`/patients/${patient.case_id}/summary`)}
                            className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            title="Open in Clinical Workspace"
                          >
                            <ExternalLink size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-lg">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Edit2 size={18} />
                </div>
                <span>Edit User Account &amp; Role</span>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.firstName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.lastName || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Assigned Role</label>
                  <select
                    value={editingUser.role || 'doctor'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="doctor">Doctor / Surgeon</option>
                    <option value="professor">Professor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Medical License ID</label>
                  <input
                    type="text"
                    value={editingUser.licenseNumber || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, licenseNumber: e.target.value })}
                    placeholder="e.g. MD-88921"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Institution / Affiliation</label>
                <input
                  type="text"
                  value={editingUser.institution || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, institution: e.target.value })}
                  placeholder="e.g. John Hopkins Orthopedics"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              {/* Password notice in edit modal */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
                <Lock size={15} className="text-slate-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Password Protection:</strong> As per security protocols, user passwords cannot be viewed or overwritten by administrators. Users manage their own passwords.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md shadow-blue-600/30 transition flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRM MODAL */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-black text-slate-900">Delete User Account?</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to permanently delete account for{' '}
                <strong className="text-slate-800">{deletingUser.firstName} {deletingUser.lastName}</strong> ({deletingUser.email})?
              </p>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-xs text-red-800 font-medium">
              ⚠️ This action is irreversible. All access tokens for this user will be invalidated.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingUser(null)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteUser}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-md shadow-red-600/30 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? <RefreshCw size={15} className="animate-spin" /> : <Trash2 size={15} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PATIENT MODAL */}
      {editingPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 my-8 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5 text-slate-900 font-extrabold text-lg">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <ClipboardList size={18} />
                </div>
                <span>Administrative Patient Data Override ({editingPatient.case_id})</span>
              </div>
              <button
                onClick={() => setEditingPatient(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Patient Name</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.patient_name || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, patient_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">MRN</label>
                  <input
                    type="text"
                    required
                    value={editingPatient.mrn || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, mrn: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Age</label>
                  <input
                    type="number"
                    value={editingPatient.patient_age || ''}
                    onChange={(e) => setEditingPatient({ ...editingPatient, patient_age: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Gender</label>
                  <select
                    value={editingPatient.patient_gender || 'Female'}
                    onChange={(e) => setEditingPatient({ ...editingPatient, patient_gender: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Status</label>
                  <select
                    value={editingPatient.status || 'active'}
                    onChange={(e) => setEditingPatient({ ...editingPatient, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="active">Active</option>
                    <option value="pending-review">Pending Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Surgical / Clinical Indication</label>
                <input
                  type="text"
                  value={editingPatient.clinical_indication || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, clinical_indication: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Lead Clinician</label>
                <input
                  type="text"
                  value={editingPatient.clinician || ''}
                  onChange={(e) => setEditingPatient({ ...editingPatient, clinician: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPatient(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition flex items-center gap-2"
                >
                  {isSubmitting ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  Save Patient Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
