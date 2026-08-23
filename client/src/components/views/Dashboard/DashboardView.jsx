import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  AlertTriangle,
  Activity,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  UserRound,
  Plus,
} from 'lucide-react';
import { usePatientContext } from '../../../context/PatientDataContext';

export default function DashboardView({ onSelectPatient }) {
  const navigate = useNavigate();
  const handleSelectPatient = onSelectPatient || ((id) => navigate(`/patients/${id}/metabolic`));
  const { patients, setIsNewCaseModalOpen } = usePatientContext();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      const matchSearch =
        !searchTerm ||
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.condition?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [patients, searchTerm, statusFilter]);

  const activeCases = filteredPatients.filter((p) => p.status === 'active').length;
  const pendingReviews = filteredPatients.filter((p) => p.status === 'pending-review').length;
  const highRiskCases = filteredPatients.length;

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
      val: highRiskCases || 4,
    },
  ];

  const getRiskBadge = (status) => {
    const map = {
      active: { text: 'HIGH', cls: 'bg-red-100 text-red-700 ring-red-200' },
      'pending-review': { text: 'MODERATE', cls: 'bg-amber-100 text-amber-700 ring-amber-200' },
      completed: { text: 'LOW', cls: 'bg-teal-100 text-teal-700 ring-teal-200' },
    };
    return map[status] || map.active;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Clinical Dashboard</h2>
          <p className="text-slate-600 mt-1 text-base">
            Overview of active patient cases, endocrine profiles, and AI assessments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search patients, conditions..."
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          /> */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending-review">Pending Review</option>
            <option value="completed">Completed</option>
          </select>

          {/* <button
            onClick={() => setIsNewCaseModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 transition"
          >
            <Plus size={16} />
            New Case Analysis
          </button> */}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-sm font-semibold text-slate-500">{s.label}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-4xl font-black text-slate-900 tracking-tight">{s.val}</p>
                  <span className="text-xs font-bold text-slate-400">cases</span>
                </div>
              </div>
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-lg`}>
                <s.icon className="text-white" size={26} strokeWidth={2.2} />
              </div>
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-xl ${s.bg} ring-1 ring-slate-100`}>
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
              <span className="text-xs font-semibold text-slate-700">
                {i === 0 && '2 new cases this week'}
                {i === 1 && 'Requires review within 48h'}
                {i === 2 && 'Prioritize metabolic stabilization'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-7 py-5 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Recent Cases</h3>
              <p className="text-sm text-slate-500">Click any patient card to open their workflow.</p>
            </div>
            <button className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View All <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredPatients.length === 0 ? (
              <div className="p-10 text-center text-slate-500 text-sm">No matching patients found.</div>
            ) : (
              filteredPatients.map((p) => {
                const badge = getRiskBadge(p.status);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPatient(p.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition group text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold">
                        <UserRound size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900">{p.id}</p>
                          <span className="text-xs text-slate-400">•</span>
                          <p className="text-sm text-slate-600 font-medium">{p.name}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-slate-500 font-medium">{p.procedure}</p>
                          <span className="text-xs text-slate-400">•</span>
                          <p className="text-xs text-slate-500 font-medium">
                            {p.age} yrs • {p.gender}
                          </p>
                          <span className="text-xs text-slate-400">•</span>
                          <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                            <Clock size={12} />
                            {p.referralDate}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-black ring-1 ${badge.cls}`}>
                        {badge.text}
                      </span>
                      <ChevronRight
                        size={18}
                        className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition"
                      />
                    </div>
                  </button>
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
    </div>
  );
}
