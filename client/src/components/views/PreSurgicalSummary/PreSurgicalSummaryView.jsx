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
  Edit3,
  ShieldAlert,
} from 'lucide-react';
import { useSurgicalPlan, usePatientData } from '../../../hooks';
import { usePatientContext } from '../../../context/PatientDataContext';

export default function PreSurgicalSummaryView({ patientId }) {
  const params = useParams();
  const effectivePatientId = patientId || params.patientId || 'PEB-8842-A';
  const { plan, loading, hardwareSelection, updateHardwareSelection } = useSurgicalPlan(effectivePatientId);
  const { patient } = usePatientData(effectivePatientId);
  const { biomarkers: contextBiomarkers, roiNotes, assessment } = usePatientContext();

  const [surgeonNotes, setSurgeonNotes] = useState(
    'Patient presents with accelerated bone turnover. Advise augmentation of instrumented levels. 2-week pre-op Vitamin D & Calcium optimization protocol initiated.'
  );
  const [isFinalized, setIsFinalized] = useState(false);

  if (loading || !plan) {
    return <div className="p-10 text-center text-slate-500">Generating pre-surgical summary...</div>;
  }

  const {
    procedure = 'Procedure',
    scheduledDate = 'Scheduled',
    overview = {},
    hardwareChecklist = [],
  } = plan;

  const getRCL = (level = 'MODERATE') => {
    switch (level.toUpperCase()) {
      case 'HIGH':
      case 'CRITICAL':
        return { color: '#dc2626', label: 'HIGH RISK', text: 'text-red-700', bg: 'bg-red-50', chip: 'bg-red-100 ring-red-200', bar: 'bg-red-500' };
      case 'MODERATE':
        return { color: '#f59e0b', label: 'MODERATE', text: 'text-amber-700', bg: 'bg-amber-50', chip: 'bg-amber-100 ring-amber-200', bar: 'bg-amber-500' };
      case 'LOW':
      default:
        return { color: '#10b981', label: 'LOW RISK', text: 'text-teal-700', bg: 'bg-teal-50', chip: 'bg-teal-100 ring-teal-200', bar: 'bg-teal-500' };
    }
  };

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

  const displayBiomarkers = [
    { name: 'Parathyroid Hormone (PTH)', key: 'pth' },
    { name: '25-OH Vitamin D', key: 'vitaminD' },
    { name: 'Serum Calcium', key: 'calcium' },
    { name: 'Inorganic Phosphate', key: 'phosphate' },
    { name: 'Alkaline Phosphatase (ALP)', key: 'alp' },
    { name: 'CTX-I (Resorption)', key: 'ctx' },
  ];

  const BiomarkerTable = () => (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="text-left p-3.5 font-bold text-slate-600 text-xs uppercase tracking-wide">Marker</th>
            <th className="text-left p-3.5 font-bold text-slate-600 text-xs uppercase tracking-wide">Live Value</th>
            <th className="text-left p-3.5 font-bold text-slate-600 text-xs uppercase tracking-wide">Ref Range</th>
            <th className="text-left p-3.5 font-bold text-slate-600 text-xs uppercase tracking-wide">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {displayBiomarkers.map((item) => {
            const b = contextBiomarkers?.[item.key] || {};
            const badge = getStatusBadge(b.status || 'normal');
            return (
              <tr key={item.key} className="hover:bg-slate-50/50">
                <td className="p-3.5 font-bold text-slate-900">{item.name}</td>
                <td className="p-3.5 font-semibold text-slate-800">
                  {b.value ?? '—'} <span className="text-xs text-slate-500 font-medium">{b.unit}</span>
                </td>
                <td className="p-3.5 text-xs text-slate-500 font-semibold">{b.ref || 'Standard'}</td>
                <td className="p-3.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black ring-1 ${badge}`}>
                    {b.status === 'low' && <span>↓</span>}
                    {b.status === 'deficient' && <span>↓</span>}
                    {b.status === 'elevated' && <span>↑</span>}
                    {(!b.status || b.status === 'normal') && <CheckCircle2 size={11} />}
                    {(b.status || 'NORMAL').toUpperCase()}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-8 relative">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3.5 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 text-sm font-semibold">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Pre-Surgical Summary</h2>
          <p className="text-slate-600 mt-1 text-base">Consolidated clinical deliverable for operative planning and risk mitigation.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
          >
            <Printer size={16} />
            Print Report
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-2.5 border border-slate-200 bg-white rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer"
          >
            <Share2 size={16} />
            Share
          </button>
          <button
            onClick={handleExportPdf}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl text-sm font-bold hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer"
          >
            <FileDown size={16} />
            Export PDF
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
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Clinical Deliverable</span>
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
                <p className="text-xs font-semibold opacity-80">Locked for operative review</p>
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
              {/* Surgical Site Overview Card */}
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
                    <div className="relative aspect-square rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50 border border-slate-200 overflow-hidden flex items-center justify-center p-4">
                      <div className="text-center space-y-2">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/30">
                          <Box size={28} />
                        </div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-wide">3D Anatomical Site Target</p>
                        <p className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-block">
                          Target Segment: {overview.levels || 'L4-L5 Fusion'}
                        </p>
                        <p className="text-[10px] text-slate-500">Cross-referenced with volumetric 3D planning engine</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Approach</p>
                        <p className="text-sm font-bold text-slate-900">{overview.approach || 'Posterior Lumbar'}</p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Target Levels</p>
                        <p className="text-sm font-bold text-slate-900">{overview.levels || 'L4-L5'}</p>
                      </div>
                      <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-wide mb-1">Key Considerations</p>
                        <ul className="text-xs text-slate-700 font-semibold leading-relaxed mt-1 space-y-1">
                          {(overview.considerations || ['Augment fixation with cement', 'Assess bone density pre-op']).map((c, i) => (
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

              {/* Dynamic Key Biomarkers Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-slate-900">Synchronized Chemical Biomarkers</h4>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Live Values
                  </span>
                </div>
                <div className="p-6">
                  <BiomarkerTable />
                </div>
              </div>

              {/* Regional 3D Planning Annotations Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center gap-2">
                  <Edit3 size={16} className="text-blue-600" />
                  <h4 className="text-base font-extrabold text-slate-900">3D Region of Interest (ROI) Annotations</h4>
                </div>
                <div className="p-6 space-y-3">
                  {Object.keys(roiNotes).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No custom ROI annotations added yet.</p>
                  ) : (
                    Object.entries(roiNotes).map(([region, note]) => (
                      <div key={region} className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                          {region.replace('-', ' ')}:
                        </span>
                        <p className="text-xs text-slate-700 font-medium leading-relaxed">{note}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Dynamic AI Risk Assessment Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <AlertTriangle size={16} />
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900">Dynamic AI Risk Assessment</h4>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full ${getRCL(assessment.overallQualityRisk >= 65 ? 'HIGH' : assessment.overallQualityRisk >= 40 ? 'MODERATE' : 'LOW').chip}`}>
                    {assessment.overallQualityRisk}% RISK
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-600">Estimated DEXA T-Score:</span>
                    <span className="font-black text-slate-900">{assessment.dexa_tscore}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <span className="font-bold text-slate-600">Structural Vulnerability:</span>
                    <span className="font-black text-slate-900">{assessment.structuralVulnerability}%</span>
                  </div>
                </div>

                {assessment.insights?.length > 0 && (
                  <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200 flex items-start gap-3">
                    <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-amber-900 uppercase tracking-wide mb-1">Primary Observation</p>
                      <p className="text-xs text-amber-900 leading-relaxed font-semibold">
                        {assessment.insights[0].text}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Surgeon's Overall Notes */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h4 className="text-base font-extrabold text-slate-900 mb-4">Surgeon&apos;s Comprehensive Plan</h4>
                <textarea
                  value={surgeonNotes}
                  onChange={(e) => setSurgeonNotes(e.target.value)}
                  disabled={isFinalized}
                  rows={4}
                  placeholder="Enter patient-specific surgical considerations..."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-600 resize-none font-medium leading-relaxed"
                />
              </div>

              {/* Surgical Hardware Checklist */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-base font-extrabold text-slate-900">Hardware Checklist</h4>
                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                    {selectedHardwareCount} selected
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {hardwareChecklist.map((item) => {
                    const checked = isItemSelected(item.id, item.selected);
                    const disabled = isFinalized;
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer text-xs ${
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
                          className="mt-0.5 w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <p className={`font-bold ${checked ? 'text-blue-800' : 'text-slate-900'}`}>
                            {item.name}
                            {item.spec && (
                              <span className="text-[10px] font-semibold text-slate-500 ml-1.5">({item.spec})</span>
                            )}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
            <button
              onClick={handleSaveDraft}
              disabled={isFinalized}
              className="px-5 py-3 border-2 border-slate-200 text-slate-800 rounded-xl font-bold hover:bg-slate-50 transition flex items-center gap-2 disabled:opacity-50 text-sm cursor-pointer"
            >
              Save Draft
            </button>
            <button
              onClick={() => {
                setIsFinalized(true);
                showToast('Pre-surgical planning deliverable finalized and locked.');
              }}
              disabled={isFinalized}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition shadow-xl shadow-blue-600/25 flex items-center gap-2 disabled:opacity-70 text-sm cursor-pointer"
            >
              {isFinalized ? (
                <>
                  <CheckCircle2 size={18} />
                  Plan Finalized & Locked
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

      {/* Strict Regulatory Boundary Disclaimer */}
      <div className="bg-slate-100 rounded-2xl border border-slate-200 p-4 text-center text-xs text-slate-600 font-medium flex items-center justify-center gap-2">
        <ShieldAlert size={16} className="text-slate-500 shrink-0" />
        <p>
          <span className="font-bold text-slate-800">Regulatory Disclaimer:</span> EndoBone AI is a pre-surgical planning and assessment simulation tool. It is <strong>NOT a diagnostic medical device</strong> and should not replace professional clinical judgment.
        </p>
      </div>
    </div>
  );
}
