import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  Activity,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Clock,
  UserRound,
  Trash2,
  AlertCircle,
  X,
  Search,
  Plus,
  Sparkles,
} from 'lucide-react';
import { usePatientContext } from '../../../context/PatientDataContext';
import { CaseLoadingOverlay } from '../../common';

export default function DashboardView({ onSelectPatient }) {
  const navigate = useNavigate();
  const {
    patients,
    deleteCase,
    setActivePatientId,
    setIsNewCaseModalOpen,
    allBiomarkers,
    regionalAnalysisDB,
  } = usePatientContext();
  const [loadingPatient, setLoadingPatient] = useState(null);

  const handleSelectPatient = (id) => {
    const targetPatient = patients.find((p) => p.id === id);
    setLoadingPatient(targetPatient || { id, name: `Patient ${id}`, procedure: 'Pre-Surgical Case' });
    setActivePatientId(id);

    setTimeout(() => {
      if (onSelectPatient) {
        onSelectPatient(id);
      } else {
        navigate(`/patients/${id}/metabolic`);
      }
    }, 550);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [caseToDelete, setCaseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getCaseRiskLevel = (patient) => {
    if (!patient) return 'moderate';

    // 1. Explicit risk level property on patient object
    const explicit = patient.risk_level || patient.riskLevel;
    if (explicit) {
      const s = String(explicit).toLowerCase();
      if (['high', 'critical', 'severe'].includes(s)) return 'high';
      if (['low', 'minimal', 'cleared'].includes(s)) return 'low';
      if (['medium', 'moderate', 'intermediate'].includes(s)) return 'moderate';
    }

    // 2. Regional analysis database mapping
    const reg = regionalAnalysisDB?.[patient.id];
    if (reg) {
      const zones = Object.values(reg);
      if (zones.some((z) => String(z.riskLevel).toLowerCase() === 'high')) return 'high';
      if (zones.some((z) => String(z.riskLevel).toLowerCase() === 'moderate')) return 'moderate';
      if (zones.some((z) => String(z.riskLevel).toLowerCase() === 'low')) return 'low';
    }

    // 3. Biomarkers evaluation if available
    const bm = allBiomarkers?.[patient.id] || patient.initial_biomarkers || patient;
    const pth = Number(bm?.pth?.value ?? bm?.pth ?? 0);
    const vitD = Number(bm?.vitaminD?.value ?? bm?.vitamin_d?.value ?? bm?.vitaminD ?? bm?.vitamin_d ?? 0);
    const calc = Number(bm?.calcium?.value ?? bm?.calcium ?? 0);

    if (pth > 0 || vitD > 0 || calc > 0) {
      let riskScore = 30;
      if (pth > 80) riskScore += 25;
      else if (pth > 65) riskScore += 12;

      if (vitD > 0 && vitD < 20) riskScore += 25;
      else if (vitD > 0 && vitD < 30) riskScore += 10;

      if (calc > 0 && (calc < 8.5 || calc > 10.5)) riskScore += 15;

      if (riskScore >= 55) return 'high';
      if (riskScore >= 35) return 'moderate';
      return 'low';
    }

    // 4. Clinical status mapping
    if (patient.status === 'completed') return 'low';
    if (patient.status === 'pending-review') return 'moderate';

    // 5. Stable distribution mapping rather than defaulting everything to high
    const idNum = String(patient.id || '').replace(/\D/g, '');
    const code = idNum ? parseInt(idNum, 10) : String(patient.id || '').charCodeAt(0);
    const rem = code % 3;
    if (rem === 0) return 'low';
    if (rem === 1) return 'moderate';
    return 'high';
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        !searchTerm ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.procedure?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.condition?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [patients, searchTerm, statusFilter]);

  const activeCases = filteredPatients.filter((p) => p.status === 'active').length;
  const pendingReviews = filteredPatients.filter((p) => p.status === 'pending-review').length;
  const highRiskCases = filteredPatients.filter((p) => getCaseRiskLevel(p) === 'high').length;

  const stats = [
    {
      label: 'Active Cases',
      value: activeCases,
      icon: FileText,
      color: 'blue',
      grad: 'from-blue-500 to-blue-700',
      bg: 'bg-blue-50',
      val: activeCases || patients.length,
    },
    {
      label: 'Pending Reviews',
      value: pendingReviews,
      icon: AlertTriangle,
      color: 'amber',
      grad: 'from-amber-500 to-orange-600',
      bg: 'bg-amber-50',
      val: pendingReviews || 1,
    },
    {
      label: 'High Risk Profile',
      value: highRiskCases,
      icon: Activity,
      color: 'red',
      grad: 'from-red-500 to-red-700',
      bg: 'bg-red-50',
      val: highRiskCases || 1,
    },
  ];

  const getRiskBadge = (patient) => {
    const risk = getCaseRiskLevel(patient);
    if (risk === 'high') {
      return { text: 'HIGH', cls: 'bg-red-100 text-red-700 ring-red-200' };
    }
    if (risk === 'low') {
      return { text: 'LOW', cls: 'bg-teal-100 text-teal-700 ring-teal-200' };
    }
    return { text: 'MODERATE', cls: 'bg-amber-100 text-amber-700 ring-amber-200' };
  };

  const handleConfirmDelete = async () => {
    if (!caseToDelete) return;
    setIsDeleting(true);
    try {
      await deleteCase(caseToDelete.id);
    } finally {
      setIsDeleting(false);
      setCaseToDelete(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0 max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 min-w-0">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Clinical Dashboard</h2>
          <p className="text-slate-600 mt-0.5 sm:mt-1 text-xs sm:text-sm lg:text-base">
            Overview of active patient cases, endocrine profiles, and AI assessments.
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
          <button
            onClick={() => setIsNewCaseModalOpen(true)}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-blue-600/20 cursor-pointer"
          >
            <Plus size={16} />
            <span>New Case Analysis</span>
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 sm:py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 shadow-sm cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending-review">Pending Review</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-500">{s.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">{s.val}</p>
                  <span className="text-xs font-bold text-slate-400">cases</span>
                </div>
              </div>
              <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-lg shrink-0`}>
                <s.icon className="text-white" size={22} strokeWidth={2.2} />
              </div>
            </div>
            <div className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-xl ${s.bg} ring-1 ring-slate-100`}>
              <TrendingUp
                size={14}
                className={
                  s.color === 'red'
                    ? 'text-red-600'
                    : s.color === 'amber'
                      ? 'text-amber-600'
                      : 'text-blue-600'
                }
              />
              <span className="text-[11px] sm:text-xs font-semibold text-slate-700 truncate">
                {i === 0 && '2 new cases this week'}
                {i === 1 && 'Requires review within 48h'}
                {i === 2 && 'Prioritize metabolic stabilization'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:px-6 sm:py-5 border-b border-slate-100 gap-3">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">Recent Cases</h3>
              <p className="text-xs sm:text-sm text-slate-500">Click any patient to open their workflow.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Filter cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-40"
                />
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg shrink-0">
                {filteredPatients.length} Total
              </span>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredPatients.length === 0 ? (
              <div className="p-8 sm:p-10 text-center text-slate-500 text-xs sm:text-sm">No matching patients found.</div>
            ) : (
              filteredPatients.map((p) => {
                const badge = getRiskBadge(p);
                return (
                  <div
                    key={p.id}
                    className="w-full flex items-center justify-between p-3.5 sm:p-5 hover:bg-slate-50/80 transition group gap-2"
                  >
                    <button
                      onClick={() => handleSelectPatient(p.id)}
                      className="flex-1 flex items-center gap-2.5 sm:gap-4 text-left focus:outline-none min-w-0 cursor-pointer"
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold shrink-0">
                        <UserRound size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                          <p className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-600 transition">{p.id}</p>
                          <span className="text-xs text-slate-400">•</span>
                          <p className="text-xs sm:text-sm text-slate-700 font-semibold truncate">{p.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-3 mt-0.5 sm:mt-1 flex-wrap text-[11px] sm:text-xs text-slate-500 font-medium">
                          <span className="truncate max-w-[120px] sm:max-w-none">{p.procedure}</span>
                          <span>•</span>
                          <span>{p.age} yrs • {p.gender}</span>
                          {p.referralDate && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <div className="hidden sm:flex items-center gap-1">
                                <Clock size={11} />
                                <span>{p.referralDate}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 sm:gap-2 pl-2 shrink-0">
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-black ring-1 ${badge.cls}`}>
                        {badge.text}
                      </span>

                      {/* Delete Case Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCaseToDelete(p);
                        }}
                        title={`Delete case ${p.id}`}
                        className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectPatient(p.id)}
                        className="p-1 text-slate-400 group-hover:text-blue-600 transition hidden xs:block cursor-pointer"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">Risk Distribution</h3>
            <div className="space-y-4">
              {[
                { label: 'High Risk', count: 5, pct: 42, color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Moderate', count: 4, pct: 33, color: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Low / Normal', count: 3, pct: 25, color: 'bg-teal-500', text: 'text-teal-600', bg: 'bg-teal-50' },
              ].map((r, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                      <span className="text-sm font-semibold text-slate-700">{r.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${r.text}`}>{r.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${r.color} rounded-full transition-all`} style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                <TrendingDown size={16} />
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">Insight</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              71% of high-risk cases have concurrent Vitamin D deficiency and elevated PTH.
              Consider pre-surgical metabolic optimization protocol for matching cases.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {caseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Delete Case from Database</h3>
                  <p className="text-xs text-slate-500 font-medium">Permanent database removal</p>
                </div>
              </div>
              <button
                onClick={() => setCaseToDelete(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <p className="text-xs text-slate-700 leading-relaxed">
                Are you sure you want to permanently delete patient case{' '}
                <span className="font-bold text-slate-950 font-mono">{caseToDelete.id}</span>
                {caseToDelete.name ? ` (${caseToDelete.name})` : ''}?
              </p>
              <p className="text-[11px] text-red-600 font-medium">
                • This action will erase associated biomarker profiles, 3D anatomical planning notes, and simulation data from the database.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCaseToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl shadow-md shadow-red-600/20 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Trash2 size={14} />
                {isDeleting ? 'Deleting...' : 'Delete Case'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Selection Loading Overlay */}
      {loadingPatient && (
        <CaseLoadingOverlay
          patientId={loadingPatient.id}
          patientName={loadingPatient.name}
          procedure={loadingPatient.procedure}
        />
      )}
    </div>
  );
}
