import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Sparkles,
  FlaskConical,
  Info,
  BarChart2,
  Stethoscope,
  Users,
} from 'lucide-react';
import { usePatientContext } from '../../context/PatientDataContext';

const PRESETS = [
  {
    id: 'severe-hpt',
    title: 'Secondary HPT / High Risk',
    badge: 'High Risk',
    badgeCls: 'bg-red-100 text-red-700 ring-1 ring-red-200',
    values: {
      pth: 72.4,
      vitaminD: 28.1,
      calcium: 9.4,
      phosphate: 3.2,
      alp: 112,
      ctx: 380,
    },
  },
  {
    id: 'moderate-deficiency',
    title: 'Vitamin D Deficiency',
    badge: 'Moderate',
    badgeCls: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    values: {
      pth: 64.0,
      vitaminD: 18.5,
      calcium: 8.8,
      phosphate: 3.0,
      alp: 92,
      ctx: 310,
    },
  },
  {
    id: 'normal-baseline',
    title: 'Optimal Homeostasis',
    badge: 'Normal',
    badgeCls: 'bg-teal-100 text-teal-700 ring-1 ring-teal-200',
    values: {
      pth: 42.0,
      vitaminD: 45.0,
      calcium: 9.6,
      phosphate: 3.5,
      alp: 78,
      ctx: 210,
    },
  },
];

const PROCEDURES = [
  {
    id: 'tka',
    name: 'Total Knee Arthroplasty (TKA)',
    desc: 'Distal femur/knee 3D anatomy, ROI, planning annotations and scenario visualization',
  },
  {
    id: 'tha',
    name: 'Total Hip Arthroplasty (THA)',
    desc: 'Proximal femur/hip anatomy and implant/planning considerations',
  },
  {
    id: 'fff',
    name: 'Femoral fracture fixation',
    desc: '3D fracture-region visualization, ROI and fixation-planning concepts',
  },
  {
    id: 'dfff',
    name: 'Distal femur fracture fixation',
    desc: 'Directly compatible with a femur-focused system',
  },
  {
    id: 'pfff',
    name: 'Proximal femur fracture fixation',
    desc: 'Useful future extension around femoral neck/intertrochanteric region',
  },
  {
    id: 'rap',
    name: 'Revision arthroplasty planning',
    desc: 'Bone-stock/anatomical review with clinical biomarkers',
  },
];

export default function NewCaseModal() {
  const { isNewCaseModalOpen, setIsNewCaseModalOpen, addNewCase } = usePatientContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    procedure: PROCEDURES[1].name, // Total Hip Arthroplasty (THA) default
    gender: 'Female',
    pth: 72.4,
    vitaminD: 28.1,
    calcium: 9.4,
    phosphate: 3.2,
    alp: 112,
    ctx: 380,
  });

  if (!isNewCaseModalOpen) return null;

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      ...preset.values,
    }));
  };

  const getStatus = (key, val) => {
    const v = parseFloat(val) || 0;
    switch (key) {
      case 'pth':
        return v > 65 ? 'High' : v < 15 ? 'Low' : null;
      case 'vitaminD':
        return v < 30 ? 'Low' : v > 100 ? 'High' : null;
      case 'calcium':
        return v < 8.6 ? 'Low' : v > 10.3 ? 'High' : null;
      case 'phosphate':
        return v < 2.5 ? 'Low' : v > 4.5 ? 'High' : null;
      case 'alp':
        return v > 147 ? 'High' : v < 44 ? 'Low' : null;
      default:
        return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newPatientId = await addNewCase(formData);
    setIsNewCaseModalOpen(false);
    navigate(`/patients/${newPatientId}/metabolic`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <FlaskConical size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-tight">Biomarker Input & Case Intake</h2>
              <p className="text-xs text-slate-500 font-medium">Configure surgical procedure and lab values to initialize 3D AI risk profiling.</p>
            </div>
          </div>
          <button
            onClick={() => setIsNewCaseModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 scrollbar-thin bg-slate-50/50">
          
          {/* Quick Preset Selector */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-600" />
              Quick Reference Presets:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition text-xs font-semibold text-slate-700 flex items-center gap-1.5"
                >
                  <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${p.badgeCls}`}>{p.badge}</span>
                  {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Surgical Procedure & Gender Strip */}
          <div className="grid md:grid-cols-3 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Stethoscope size={14} className="text-blue-600" />
                Surgical Procedure
              </label>
              <select
                value={formData.procedure}
                onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {PROCEDURES.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 italic">
                {PROCEDURES.find((p) => p.name === formData.procedure)?.desc || ''}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Users size={14} className="text-blue-600" />
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Biomarker Two-Column Layout */}
          <div className="grid md:grid-cols-5 gap-5">
            
            {/* Left Card (3 cols): Bone Metabolism Panel */}
            <div className="md:col-span-3 bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <FlaskConical size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Bone Metabolism Panel</h3>
              </div>

              <div className="space-y-3">
                {/* PTH */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-800 font-semibold min-w-[160px]">
                    <span>Parathyroid Hormone (PTH)</span>
                    <span title="NHANES LBXPT21 (Ref: 15.0–65.0 pg/mL)" className="text-slate-400 cursor-help"><Info size={13} /></span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className={`flex items-center border rounded-lg overflow-hidden bg-white ${
                      getStatus('pth', formData.pth) === 'High' ? 'border-red-400 ring-1 ring-red-300' : 'border-slate-200'
                    }`}>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.pth}
                        onChange={(e) => setFormData({ ...formData, pth: e.target.value })}
                        className="w-24 px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none text-right"
                      />
                      <span className="px-2.5 py-1.5 bg-slate-50 text-slate-500 font-medium text-[11px] border-l border-slate-200">
                        pg/mL
                      </span>
                    </div>
                    {getStatus('pth', formData.pth) === 'High' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">High</span>
                    )}
                  </div>
                </div>

                {/* Vitamin D */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-800 font-semibold min-w-[160px]">
                    <span>Vitamin D (25-OH)</span>
                    <span title="NHANES 2017–2018 (Ref: 30.0–100.0 ng/mL)" className="text-slate-400 cursor-help"><Info size={13} /></span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className={`flex items-center border rounded-lg overflow-hidden bg-white ${
                      getStatus('vitaminD', formData.vitaminD) === 'Low' ? 'border-amber-400 ring-1 ring-amber-300' : 'border-slate-200'
                    }`}>
                      <input
                        type="number"
                        step="0.1"
                        value={formData.vitaminD}
                        onChange={(e) => setFormData({ ...formData, vitaminD: e.target.value })}
                        className="w-24 px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none text-right"
                      />
                      <span className="px-2.5 py-1.5 bg-slate-50 text-slate-500 font-medium text-[11px] border-l border-slate-200">
                        ng/mL
                      </span>
                    </div>
                    {getStatus('vitaminD', formData.vitaminD) === 'Low' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Low</span>
                    )}
                  </div>
                </div>

                {/* Serum Calcium */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-800 font-semibold min-w-[160px]">
                    <span>Total Calcium</span>
                    <span title="NHANES LBXSC3SI (Ref: 8.6–10.3 mg/dL)" className="text-slate-400 cursor-help"><Info size={13} /></span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <input
                        type="number"
                        step="0.1"
                        value={formData.calcium}
                        onChange={(e) => setFormData({ ...formData, calcium: e.target.value })}
                        className="w-24 px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none text-right"
                      />
                      <span className="px-2.5 py-1.5 bg-slate-50 text-slate-500 font-medium text-[11px] border-l border-slate-200">
                        mg/dL
                      </span>
                    </div>
                  </div>
                </div>

                {/* Serum Phosphate */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-800 font-semibold min-w-[160px]">
                    <span>Serum Phosphate</span>
                    <span title="NHANES LBXSPH (Ref: 2.5–4.5 mg/dL)" className="text-slate-400 cursor-help"><Info size={13} /></span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <input
                        type="number"
                        step="0.1"
                        value={formData.phosphate}
                        onChange={(e) => setFormData({ ...formData, phosphate: e.target.value })}
                        className="w-24 px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none text-right"
                      />
                      <span className="px-2.5 py-1.5 bg-slate-50 text-slate-500 font-medium text-[11px] border-l border-slate-200">
                        mg/dL
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alkaline Phosphatase */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-800 font-semibold min-w-[160px]">
                    <span>Alkaline Phosphatase (ALP)</span>
                    <span title="NHANES LBXSAPSI (Ref: 44–147 IU/L)" className="text-slate-400 cursor-help"><Info size={13} /></span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                      <input
                        type="number"
                        step="1"
                        value={formData.alp}
                        onChange={(e) => setFormData({ ...formData, alp: e.target.value })}
                        className="w-24 px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none text-right"
                      />
                      <span className="px-2.5 py-1.5 bg-slate-50 text-slate-500 font-medium text-[11px] border-l border-slate-200">
                        IU/L
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Cards (2 cols): Action Card */}
            <div className="md:col-span-2 space-y-4 flex flex-col justify-between">
              <div className="bg-blue-50/70 rounded-xl border border-blue-200/60 p-5 space-y-3">
                <h4 className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  AI Assessment Pipeline
                </h4>
                <p className="text-xs text-blue-900/80 leading-relaxed">
                  Upon intake, the EndoBone AI rule engine evaluates bone mineral density indicators, calculates cortical risk, and initializes 3D anatomical planning.
                </p>
              </div>

              {/* Action Verification Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm">
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Ensure all out-of-range values are verified before proceeding to analysis.
                </p>

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition"
                >
                  <BarChart2 size={16} />
                  Analyze Patient Data
                </button>
              </div>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
