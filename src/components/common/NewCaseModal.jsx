import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Plus,
  Sparkles,
  UserRound,
  FlaskConical,
  Activity,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { usePatientContext } from '../../context/PatientDataContext';

const PRESETS = [
  {
    id: 'severe-hpt',
    title: 'Secondary HPT / High Risk',
    desc: 'Low Vit D (<20), elevated PTH (>70), high turnover (CTX >380)',
    badge: 'High Risk Profile',
    badgeCls: 'bg-red-100 text-red-700 ring-red-200',
    values: {
      pth: 88,
      vitaminD: 15,
      calcium: 8.4,
      phosphate: 3.1,
      alp: 110,
      ctx: 410,
      condition: 'Severe secondary hyperparathyroidism with accelerated bone resorption',
    },
  },
  {
    id: 'moderate-deficiency',
    title: 'Moderate Osteopenia / Deficiency',
    desc: 'Sub-optimal Vit D (22), borderline PTH (68), moderate turnover',
    badge: 'Moderate Profile',
    badgeCls: 'bg-amber-100 text-amber-700 ring-amber-200',
    values: {
      pth: 68,
      vitaminD: 22,
      calcium: 8.9,
      phosphate: 3.4,
      alp: 88,
      ctx: 320,
      condition: 'Pre-operative osteopenia with vitamin D insufficiency',
    },
  },
  {
    id: 'normal-baseline',
    title: 'Optimal Bone Mineral Homeostasis',
    desc: 'Normal serum calcium, robust Vit D (>40), normal PTH (<50)',
    badge: 'Low Risk Profile',
    badgeCls: 'bg-teal-100 text-teal-700 ring-teal-200',
    values: {
      pth: 42,
      vitaminD: 45,
      calcium: 9.4,
      phosphate: 3.6,
      alp: 74,
      ctx: 220,
      condition: 'Normal bone mineral homeostasis, candidate for standard fixation',
    },
  },
];

const PROCEDURES = [
  'Posterior Lumbar Interbody Fusion (L4-L5)',
  'Total Hip Arthroplasty (THA)',
  'Femoral Neck Cannulated Screw Fixation',
  'Total Knee Arthroplasty (TKA)',
  'Anterior Cervical Discectomy & Fusion (ACDF)',
  'Proximal Femoral Nailing (PFN)',
];

export default function NewCaseModal() {
  const { isNewCaseModalOpen, setIsNewCaseModalOpen, addNewCase } = usePatientContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: 'Eleanor Vance',
    age: 64,
    gender: 'Female',
    procedure: PROCEDURES[0],
    condition: 'L4-L5 Degenerative Spondylolisthesis with Bone Fragility',
    pth: 76,
    vitaminD: 18,
    calcium: 8.5,
    phosphate: 3.2,
    alp: 92,
    ctx: 360,
    initialNote: 'High turnover suspected. Consider preoperative metabolic replenishment and augmented screw fixation.',
  });

  if (!isNewCaseModalOpen) return null;

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      ...preset.values,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newPatientId = addNewCase(formData);
    setIsNewCaseModalOpen(false);
    navigate(`/patients/${newPatientId}/metabolic`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/80 border border-blue-400/40 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Dna size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Create New Patient Case</h2>
              <p className="text-xs text-blue-200 font-medium">
                Initialize patient profile, endocrine baseline, and 3D preoperative simulation.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsNewCaseModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
          {/* Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-600" />
                Quick Clinical Presets (Optional)
              </label>
              <span className="text-[11px] text-slate-400 font-semibold">Click to prefill biomarkers</span>
            </div>
            <div className="grid sm:grid-cols-3 gap-2.5">
              {PRESETS.map((preset) => (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => handleApplyPreset(preset)}
                  className="p-3 text-left rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition group relative"
                >
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black ${preset.badgeCls} mb-1.5`}>
                    {preset.badge}
                  </span>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 leading-tight">
                    {preset.title}
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1 leading-snug">
                    {preset.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Demographics */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <UserRound size={14} className="text-blue-600" />
              1. Patient Demographics & Surgical Target
            </h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Patient Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Age (Years)</label>
                <input
                  type="number"
                  min="18"
                  max="105"
                  required
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Target Procedure</label>
                <select
                  value={formData.procedure}
                  onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {PROCEDURES.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">Clinical Condition / Indication</label>
                <input
                  type="text"
                  value={formData.condition}
                  onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                  placeholder="e.g. Osteopenic Bone Fragility"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Baseline Biomarkers */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
              <FlaskConical size={14} className="text-blue-600" />
              2. Initial Endocrine & Bone Turnover Biomarkers
            </h3>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">PTH</span>
                  <span className="text-[10px] text-slate-400 font-semibold">15–65 pg/mL</span>
                </div>
                <input
                  type="number"
                  step="1"
                  value={formData.pth}
                  onChange={(e) => setFormData({ ...formData, pth: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">25-OH Vit D</span>
                  <span className="text-[10px] text-slate-400 font-semibold">30–100 ng/mL</span>
                </div>
                <input
                  type="number"
                  step="1"
                  value={formData.vitaminD}
                  onChange={(e) => setFormData({ ...formData, vitaminD: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Serum Calcium</span>
                  <span className="text-[10px] text-slate-400 font-semibold">8.6–10.3 mg/dL</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={formData.calcium}
                  onChange={(e) => setFormData({ ...formData, calcium: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">Phosphate</span>
                  <span className="text-[10px] text-slate-400 font-semibold">2.5–4.5 mg/dL</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={formData.phosphate}
                  onChange={(e) => setFormData({ ...formData, phosphate: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">ALP</span>
                  <span className="text-[10px] text-slate-400 font-semibold">44–147 U/L</span>
                </div>
                <input
                  type="number"
                  step="1"
                  value={formData.alp}
                  onChange={(e) => setFormData({ ...formData, alp: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-800">CTX-I (Resorption)</span>
                  <span className="text-[10px] text-slate-400 font-semibold">&lt; 300 pg/mL</span>
                </div>
                <input
                  type="number"
                  step="10"
                  value={formData.ctx}
                  onChange={(e) => setFormData({ ...formData, ctx: e.target.value })}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Pre-op Clinical Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1 block">Initial Clinical / Surgeon's Note</label>
            <textarea
              rows={2}
              value={formData.initialNote}
              onChange={(e) => setFormData({ ...formData, initialNote: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewCaseModalOpen(false)}
              className="px-5 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-black rounded-xl text-xs hover:from-blue-700 hover:to-indigo-700 transition shadow-xl shadow-blue-600/25 flex items-center gap-2"
            >
              <Plus size={16} />
              Launch New Case Analysis
              <ChevronRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
