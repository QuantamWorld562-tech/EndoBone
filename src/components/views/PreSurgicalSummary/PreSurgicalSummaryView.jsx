import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileDown,
  FileText,
  Box,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Upload,
  Clock,
  UserRound,
  AlertCircle,
  Printer,
  Share2,
} from 'lucide-react';
import { useSurgicalPlan, usePatientData } from '../../../hooks';

export default function PreSurgicalSummaryView({ patientId }) {
  const params = useParams();
  const effectivePatientId = patientId || params.patientId || 'PEB-8842-A';
  const { plan, loading, hardwareSelection, updateHardwareSelection } = useSurgicalPlan(effectivePatientId);
  const { patient } = usePatientData(effectivePatientId);
  const [surgeonNotes, setSurgeonNotes] = useState(
    'Patient presents with DEXA T-Score -2.4 (Osteoporosis range). Given elevated CTX (bone resorption) and secondary HPT, advise augmentation of instrumented levels. Consider 2-week pre-op Vitamin D loading protocol.'
  );
  const [isFinalized, setIsFinalized] = useState(false);

  if (loading || !plan) {
    return <div className="p-10 text-center text-slate-500">Generating pre-surgical summary...</div>;
  }

  const {
    procedure = 'Procedure',
    scheduledDate = 'Scheduled',
    overview = {},
    risks = [],
    biomarkers = [],
    recommendations = {},
    hardwareChecklist = [],
  } = plan;

  const getRCL = (cls = '') =>
    cls.includes('high')
      ? { color: '#dc2626', label: 'HIGH', text: 'text-red-700', bg: 'bg-red-50', chip: 'bg-red-100 ring-red-200', bar: 'bg-red-500' }
      : cls.includes('moderate')
      ? { color: '#f59e0b', label: 'MODERATE', text: 'text-amber-700', bg: 'bg-amber-50', chip: 'bg-amber-100 ring-amber-200', bar: 'bg-amber-500' }
      : { color: '#10b981', label: 'LOW', text: 'text-teal-700', bg: 'bg-teal-50', chip: 'bg-teal-100 ring-teal-200', bar: 'bg-teal-500' };

  const getStatusBadge = (status = '') => {
    switch (status.toLowerCase()) {
      case 'elevated':
        return 'bg-red-50 text-red-700 ring-red-200';
      case 'low':
      case 'deficient':
        return 'bg-amber-50 text-amber-700 ring-amber-200';
      case 'normal':
      default:
        return 'bg-teal-50 text-teal-700 ring-teal-200';
    }
  };

  const isItemSelected = (id, defaultSelected) => {
    if (hardwareSelection[id] !== undefined) return hardwareSelection[id];
    return defaultSelected;
  };

  const toggleHardwareItem = (id, currentVal) => {
    updateHardwareSelection(id, !currentVal);
  };

  const selectedHardwareCount = hardwareChecklist.filter((h) =>
    isItemSelected(h.id, h.selected)
  ).length;

  const BiomarkerTable = () => (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left p-3.5 font-bold text-slate-600 text-xs uppercase tracking-wide">Marker</th>
            <th className="text-left p-3.5 font-bold text-slate-600 text-xs uppercase tracking-wide">Value</th>
            <th className="text-left p-3.5 font-bold text-slate-600 text-xs uppercase tracking-wide">Ref Range</th>
            <th className="text-left p-3.5 font-bold text-slate-600 text-xs uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {biomarkers.map((b) => {
            const badge = getStatusBadge(b.status);
            return (
              <tr key={b.marker} className="hover:bg-slate-50/50">
                <td className="p-3.5 font-bold text-slate-900">{b.marker}</td>
                <td className="p-3.5 font-semibold text-slate-800">
                  {b.value} <span className="text-xs text-slate-500 font-medium">{b.unit}</span>
                </td>
                <td className="p-3.5 text-xs text-slate-500 font-semibold">{b.refRange}</td>
                <td className="p-3.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ring-1 ${badge}`}>
                    {b.status === 'low' && <span>↓</span>}
                    {b.status === 'elevated' && <span>↑</span>}
                    {b.status === 'normal' && <CheckCircle2 size={11} />}
                    {b.status?.toUpperCase()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const RiskBar = ({ risk }) => {
    const c = getRCL(risk.class || risk.level);
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <p className="text-sm font-bold text-slate-700">{risk.factor}</p>
          <div className="flex items-center gap-2">
            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black ring-1 ${c.chip} ${c.text}`}>
              {c.label}
            </span>
            <span className={`text-sm font-black ${c.text}`}>{risk.value}%</span>
          </div>
        </div>
        <div className="relative h-3 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full ${c.bar} transition-all duration-700`}
            style={{ width: `${risk.value}%` }}
          />
          <div className="absolute top-0 bottom-0 w-0.5 bg-white/60" style={{ left: '50%' }} />
        </div>
        <p className="text-xs text-slate-500 font-medium">{risk.detail}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Pre-Surgical Summary</h2>
          <p className="text-slate-600 mt-1 text-base">Consolidated report for operative planning and review.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition">
            <Printer size={16} />
            Print
          </button>
          <button className="px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition">
            <Share2 size={16} />
            Share
          </button>
          <button className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20 flex items-center gap-2 transition">
            <FileDown size={16} />
            Export Report
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-white via-slate-50 to-blue-50 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-8 py-7 border-b border-slate-200 bg-white flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <FileText size={18} />
              </div>
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Clinical Brief</span>
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">Pre-Surgical Planning Report</h3>
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <UserRound size={15} className="text-slate-500" />
                <span className="text-slate-500 font-semibold">Patient ID:</span>
                <span className="font-black text-slate-900">{effectivePatientId}</span>
              </div>
              {patient && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-semibold">Age/Gender:</span>
                  <span className="font-bold text-slate-800">
                    {patient.age} yrs • {patient.gender}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200">
                <Clock size={15} className="text-slate-500" />
                <span className="text-slate-500 font-semibold">Scheduled:</span>
                <span className="font-black text-slate-900">{scheduledDate}</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 rounded-xl border border-blue-200">
                <Box size={15} className="text-blue-600" />
                <span className="text-blue-700 font-black">{procedure}</span>
              </div>
            </div>
          </div>

          {isFinalized ? (
            <div className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-800 rounded-2xl border-2 border-emerald-200 ring-2 ring-emerald-100">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <div className="leading-tight">
                <p className="font-black text-sm">PLAN FINALIZED</p>
                <p className="text-xs font-semibold opacity-80">Locked for surgical review</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-5 py-3 bg-amber-50 text-amber-800 rounded-2xl border-2 border-amber-200 ring-2 ring-amber-100">
              <AlertCircle size={20} className="text-amber-600" />
              <div className="leading-tight">
                <p className="font-black text-sm">DRAFT MODE</p>
                <p className="text-xs font-semibold opacity-80">Click Finalize to lock</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 space-y-8">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <Box size={16} />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">Surgical Site Overview</h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                    {overview.tag || 'L4-L5'}
                  </span>
                </div>
                <div className="p-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50 border border-slate-200 overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg viewBox="0 0 300 340" className="w-4/5 h-4/5 drop-shadow-xl">
                          <defs>
                            <linearGradient id="vertGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#f1f5f9" />
                              <stop offset="100%" stopColor="#94a3b8" />
                            </linearGradient>
                          </defs>
                          {[0, 1, 2, 3, 4].map((i) => {
                            const y = 40 + i * 58;
                            return (
                              <g key={i}>
                                <ellipse
                                  cx="150"
                                  cy={y + 18}
                                  rx="54"
                                  ry="16"
                                  fill="url(#vertGrad)"
                                  stroke="#64748b"
                                  strokeWidth="1.3"
                                />
                                <rect
                                  x="96"
                                  y={y}
                                  width="108"
                                  height="18"
                                  rx="6"
                                  fill="url(#vertGrad)"
                                  stroke="#64748b"
                                  strokeWidth="1.3"
                                />
                                <path
                                  d={`M ${96} ${y + 36} L ${70} ${y + 22} L ${70} ${y + 44} L ${96} ${y + 30}`}
                                  fill="url(#vertGrad)"
                                  stroke="#64748b"
                                  strokeWidth="1.2"
                                />
                                <path
                                  d={`M ${204} ${y + 36} L ${230} ${y + 22} L ${230} ${y + 44} L ${204} ${y + 30}`}
                                  fill="url(#vertGrad)"
                                  stroke="#64748b"
                                  strokeWidth="1.2"
                                />
                                {i === 1 && (
                                  <g>
                                    <line
                                      x1="70"
                                      y1={y + 9}
                                      x2="230"
                                      y2={y + 9}
                                      stroke="#3b82f6"
                                      strokeWidth="1.8"
                                      strokeDasharray="4 3"
                                      opacity="0.85"
                                    />
                                    <text x="235" y={y + 13} fontSize="10" fill="#1d4ed8" fontWeight="700">
                                      L4
                                    </text>
                                  </g>
                                )}
                                {i === 2 && (
                                  <g>
                                    <line
                                      x1="70"
                                      y1={y + 9}
                                      x2="230"
                                      y2={y + 9}
                                      stroke="#3b82f6"
                                      strokeWidth="1.8"
                                      strokeDasharray="4 3"
                                      opacity="0.85"
                                    />
                                    <text x="235" y={y + 13} fontSize="10" fill="#1d4ed8" fontWeight="700">
                                      L5
                                    </text>
                                  </g>
                                )}
                              </g>
                            );
                          })}
                          <g opacity="0.9">
                            <line x1="110" y1="130" x2="110" y2="195" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
                            <line x1="190" y1="130" x2="190" y2="195" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round" />
                            {[130, 155, 180].map((y) => (
                              <line key={y} x1="110" y1={y} x2="190" y2={y} stroke="#93c5fd" strokeWidth="2.5" />
                            ))}
                            <circle cx="110" cy="130" r="4.5" fill="#1d4ed8" />
                            <circle cx="190" cy="130" r="4.5" fill="#1d4ed8" />
                            <circle cx="110" cy="195" r="4.5" fill="#1d4ed8" />
                            <circle cx="190" cy="195" r="4.5" fill="#1d4ed8" />
                          </g>
                          <text
                            x="150"
                            y="310"
                            fontSize="11"
                            fill="#475569"
                            fontWeight="700"
                            textAnchor="middle"
                            fontFamily="system-ui"
                          >
                            Instrumented Segments L4–L5
                          </text>
                        </svg>
                      </div>
                      {overview.dimensions?.map((d, i) => (
                        <div
                          key={i}
                          className="absolute bg-blue-600/95 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg"
                          style={{ top: `${28 + i * 13}%`, left: '65%' }}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                    <div className="space-y-5">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Approach</p>
                        <p className="text-sm font-bold text-slate-900">{overview.approach || 'Posterior'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Target Levels</p>
                        <p className="text-sm font-bold text-slate-900">{overview.levels || 'L4-L5'}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Key Considerations</p>
                        <ul className="text-xs text-slate-700 font-semibold leading-relaxed mt-1 space-y-1">
                          {(overview.considerations || []).map((c, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-600 flex-shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                  <h4 className="text-base font-extrabold text-slate-900">Key Biomarkers</h4>
                </div>
                <div className="p-6">
                  <BiomarkerTable />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <AlertTriangle size={16} />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">AI Risk Assessment</h4>
                  </div>
                </div>
                <div className="space-y-5">
                  {risks.map((r, i) => (
                    <RiskBar key={i} risk={r} />
                  ))}
                </div>

                {recommendations?.suggestion && (
                  <div className="mt-5 p-4 bg-amber-50 rounded-xl border-2 border-amber-200 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white flex-shrink-0">
                      <AlertTriangle size={15} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-amber-900 uppercase tracking-wide mb-1">Recommendation</p>
                      <p className="text-sm text-amber-900 leading-relaxed font-semibold">
                        {recommendations.suggestion}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h4 className="text-base font-extrabold text-slate-900 mb-4">Surgeon&apos;s Planning Notes</h4>
                <textarea
                  value={surgeonNotes}
                  onChange={(e) => setSurgeonNotes(e.target.value)}
                  disabled={isFinalized}
                  rows={5}
                  placeholder="Enter patient-specific surgical considerations..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600 resize-none font-medium leading-relaxed"
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-extrabold text-slate-900">Surgical Hardware Checklist</h4>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                    {selectedHardwareCount} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2.5">
                  {hardwareChecklist.map((item) => {
                    const checked = isItemSelected(item.id, item.selected);
                    const disabled = isFinalized;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer ${
                          checked
                            ? 'bg-blue-50/60 border-blue-200 ring-1 ring-blue-100'
                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => toggleHardwareItem(item.id, checked)}
                          className="mt-0.5 w-4 h-4 rounded-md text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${checked ? 'text-blue-800' : 'text-slate-900'}`}>
                            {item.name}
                            {item.spec && (
                              <span className="text-xs font-semibold text-slate-500 ml-1.5">({item.spec})</span>
                            )}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
                <button
                  disabled={isFinalized}
                  className="mt-5 w-full py-2.5 border border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <Upload size={14} />
                  Add Custom Item
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
            <button
              disabled={isFinalized}
              className="px-5 py-3 border-2 border-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-50 transition flex items-center gap-2 disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={() => setIsFinalized(true)}
              disabled={isFinalized}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition shadow-xl shadow-blue-600/25 flex items-center gap-2 disabled:opacity-70"
            >
              {isFinalized ? (
                <>
                  <CheckCircle2 size={18} />
                  Finalized
                </>
              ) : (
                <>
                  <FileDown size={18} />
                  Finalize Plan
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-slate-500 font-medium pb-8 space-y-1">
        <p>© 2024 EndoBone AI. For clinical research use only. Not a replacement for professional medical judgment.</p>
        <p>For research and demonstration purposes only.</p>
      </div>
    </div>
  );
}
