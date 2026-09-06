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
  UserCircle,
  Calendar,
  Bone,
} from 'lucide-react';
import { usePatientContext } from '../../context/PatientDataContext';
import { AVAILABLE_MODELS } from '../../utils/modelAnnotationEngine';

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
    id: 'moderate-risk',
    title: 'Osteopenic Transition',
    badge: 'Moderate',
    badgeCls: 'bg-amber-100 text-amber-700 ring-1 ring-amber-200',
    values: {
      pth: 58.0,
      vitaminD: 32.5,
      calcium: 9.2,
      phosphate: 3.6,
      alp: 95,
      ctx: 280,
    },
  },
  {
    id: 'normal-profile',
    title: 'Normal Metabolic Health',
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
    id: 'tha',
    name: 'Total Hip Arthroplasty (THA)',
    desc: 'Proximal femur/hip anatomy and implant/planning considerations',
    defaultModel: '01',
  },
  {
    id: 'tka',
    name: 'Total Knee Arthroplasty (TKA)',
    desc: 'Distal femur/knee 3D anatomy, ROI, planning annotations and scenario visualization',
    defaultModel: 'tibia',
  },
  {
    id: 'spine_fusion',
    name: 'L4-L5 Discectomy & Fusion',
    desc: 'Lumbar spine decompression and interbody cage instrumentation',
    defaultModel: 'spine',
  },
  {
    id: 'vertebroplasty',
    name: 'Vertebroplasty L3',
    desc: 'Percutaneous cement augmentation for osteoporotic compression fracture',
    defaultModel: 'spine',
  },
  {
    id: 'fff',
    name: 'Femoral fracture fixation',
    desc: '3D fracture-region visualization, ROI and fixation-planning concepts',
    defaultModel: '02',
  },
  {
    id: 'dfff',
    name: 'Distal femur fracture fixation',
    desc: 'Directly compatible with a femur-focused system',
    defaultModel: '04',
  },
  {
    id: 'pfff',
    name: 'Proximal femur fracture fixation',
    desc: 'Useful future extension around femoral neck/intertrochanteric region',
    defaultModel: '03',
  },
  {
    id: 'revision',
    name: 'Revision Arthroplasty',
    desc: 'Modular revision reconstruction with joint-specific implant and fixation checklists',
    defaultModel: '07',
  },
];

export default function NewCaseModal() {
  const { isNewCaseModalOpen, setIsNewCaseModalOpen, addNewCase } = usePatientContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    procedure: PROCEDURES[0].name, // Total Hip Arthroplasty (THA) default
    gender: 'Female',
    model_id: '01',
    scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    pth: '',
    vitaminD: '',
    calcium: '',
    phosphate: '',
    alp: '',
    ctx: '',
  });
  const [revisionSubType, setRevisionSubType] = useState('Revision Total Hip Arthroplasty');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isNewCaseModalOpen) return null;

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      ...preset.values,
    }));
  };

  const handleProcedureChange = (newProcName) => {
    const procObj = PROCEDURES.find((p) => p.name === newProcName);
    let autoModel = procObj?.defaultModel || '01';
    if (newProcName === 'Revision Arthroplasty') {
      autoModel = revisionSubType === 'Revision Total Knee Arthroplasty' ? 'tibia' : '07';
    }
    setFormData((prev) => ({
      ...prev,
      procedure: newProcName,
      model_id: autoModel,
    }));
  };

  const handleRevisionSubTypeChange = (subType) => {
    setRevisionSubType(subType);
    setFormData((prev) => ({
      ...prev,
      model_id: subType === 'Revision Total Knee Arthroplasty' ? 'tibia' : '07',
    }));
  };

  const getStatus = (key, val) => {
    if (val === '' || val === null || val === undefined) return null;
    const v = parseFloat(val);
    if (!Number.isFinite(v)) return null;

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
      case 'ctx':
        return v > 300 ? 'High' : null;
      default:
        return null;
    }
  };

  const getFieldBorder = (key, val) => {
    const s = getStatus(key, val);
    if (s === 'High') return 'border-red-400 ring-1 ring-red-300';
    if (s === 'Low') return 'border-amber-400 ring-1 ring-amber-300';
    return 'border-slate-200';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalProcedure = formData.procedure === 'Revision Arthroplasty'
        ? revisionSubType
        : formData.procedure;
      const newPatientId = await addNewCase({
        ...formData,
        procedure: finalProcedure,
        model_id: formData.model_id,
        scheduledDate: formData.scheduledDate,
      });
      setIsNewCaseModalOpen(false);
      navigate(`/patients/${newPatientId}/assessment`);
    } catch (err) {
      console.error('Case intake error:', err);
    } finally {
      setIsSubmitting(false);
    }
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

          {/* Patient Info & Surgical Procedure Strip */}
          <div className="grid md:grid-cols-6 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            {/* Patient Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserCircle size={14} className="text-blue-600" />
                Patient Name
              </label>
              <input
                type="text"
                placeholder="e.g. Priya Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
              />
            </div>

            {/* Age */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                Age
              </label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20">
                <input
                  type="number"
                  min="1"
                  max="120"
                  step="1"
                  placeholder="e.g. 58"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
                />
                <span className="px-2.5 py-2 bg-slate-100 text-slate-500 font-medium text-[11px] border-l border-slate-200 whitespace-nowrap">
                  yrs
                </span>
              </div>
            </div>

            {/* Gender */}
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

            {/* Scheduled Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar size={14} className="text-blue-600" />
                Surgery Date
              </label>
              <input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-2.5 py-2 text-xs font-medium text-slate-900 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Surgical Procedure */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Stethoscope size={14} className="text-blue-600" />
                Surgical Procedure
              </label>
              <select
                value={formData.procedure}
                onChange={(e) => handleProcedureChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                {PROCEDURES.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>

              {formData.procedure === 'Revision Arthroplasty' && (
                <div className="mt-2.5 p-2 bg-blue-50/80 border border-blue-200 rounded-lg space-y-1.5">
                  <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider block">
                    Revision Selection:
                  </span>
                  <div className="flex flex-col gap-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="newCaseRevisionSubType"
                        value="Revision Total Hip Arthroplasty"
                        checked={revisionSubType === 'Revision Total Hip Arthroplasty'}
                        onChange={(e) => handleRevisionSubTypeChange(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Rev. THA
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="newCaseRevisionSubType"
                        value="Revision Total Knee Arthroplasty"
                        checked={revisionSubType === 'Revision Total Knee Arthroplasty'}
                        onChange={(e) => handleRevisionSubTypeChange(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      Rev. TKA
                    </label>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-slate-500 italic leading-snug truncate" title={formData.procedure === 'Revision Arthroplasty'
                  ? (revisionSubType === 'Revision Total Knee Arthroplasty'
                      ? 'Revision femoral/tibial components, augments, and constraint'
                      : 'Revision stem, cup/shell, augments, screws, and graft')
                  : (PROCEDURES.find((p) => p.name === formData.procedure)?.desc || '')}>
                {formData.procedure === 'Revision Arthroplasty'
                  ? (revisionSubType === 'Revision Total Knee Arthroplasty'
                      ? 'Revision components, augments, constraint'
                      : 'Revision stem, cup, screws, graft')
                  : (PROCEDURES.find((p) => p.name === formData.procedure)?.desc || '')}
              </p>
            </div>

            {/* 3D Bone Model & CT Scan */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Bone size={14} className="text-blue-600" />
                3D Bone Model
              </label>
              <select
                value={formData.model_id}
                onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                className="w-full px-3 py-2 text-xs font-medium text-slate-900 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <optgroup label="Patient CT Scans (Femur)">
                  {AVAILABLE_MODELS.filter((m) => m.type === 'femur').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Spine, Knee &amp; Pelvis">
                  {AVAILABLE_MODELS.filter((m) => m.type !== 'femur').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              </select>
              <p className="text-[11px] text-slate-500 italic leading-snug truncate" title={AVAILABLE_MODELS.find((m) => m.id === formData.model_id)?.indication}>
                {AVAILABLE_MODELS.find((m) => m.id === formData.model_id)?.indication || 'Target 3D geometric mesh'}
              </p>
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
                    <div className={`flex items-center border rounded-lg overflow-hidden bg-white ${getFieldBorder('pth', formData.pth)}`}>
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
                    {getStatus('pth', formData.pth) === 'Low' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Low</span>
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
                    <div className={`flex items-center border rounded-lg overflow-hidden bg-white ${getFieldBorder('vitaminD', formData.vitaminD)}`}>
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
                    {getStatus('vitaminD', formData.vitaminD) === 'High' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">High</span>
                    )}
                  </div>
                </div>

                {/* Total Calcium */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-800 font-semibold min-w-[160px]">
                    <span>Total Calcium</span>
                    <span title="NHANES LBXSC3SI (Ref: 8.6–10.3 mg/dL)" className="text-slate-400 cursor-help"><Info size={13} /></span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className={`flex items-center border rounded-lg overflow-hidden bg-white ${getFieldBorder('calcium', formData.calcium)}`}>
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
                    {getStatus('calcium', formData.calcium) === 'Low' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Low</span>
                    )}
                    {getStatus('calcium', formData.calcium) === 'High' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">High</span>
                    )}
                  </div>
                </div>

                {/* Total Phosphate */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-800 font-semibold min-w-[160px]">
                    <span>Total Phosphate</span>
                    <span title="NHANES LBXSPH (Ref: 2.5–4.5 mg/dL)" className="text-slate-400 cursor-help"><Info size={13} /></span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className={`flex items-center border rounded-lg overflow-hidden bg-white ${getFieldBorder('phosphate', formData.phosphate)}`}>
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
                    {getStatus('phosphate', formData.phosphate) === 'Low' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Low</span>
                    )}
                    {getStatus('phosphate', formData.phosphate) === 'High' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">High</span>
                    )}
                  </div>
                </div>

                {/* Alkaline Phosphatase */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-800 font-semibold min-w-[160px]">
                    <span>Alkaline Phosphatase (ALP)</span>
                    <span title="NHANES LBXSAPSI (Ref: 44–147 IU/L)" className="text-slate-400 cursor-help"><Info size={13} /></span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className={`flex items-center border rounded-lg overflow-hidden bg-white ${getFieldBorder('alp', formData.alp)}`}>
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
                    {getStatus('alp', formData.alp) === 'High' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">High</span>
                    )}
                    {getStatus('alp', formData.alp) === 'Low' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">Low</span>
                    )}
                  </div>
                </div>

                {/* CTX-I (Resorption) */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1 text-slate-800 font-semibold min-w-[160px]">
                    <span>CTX-I (Resorption)</span>
                    <span title="Bone Turnover Resorption Marker (Ref: < 300 pg/mL)" className="text-slate-400 cursor-help"><Info size={13} /></span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className={`flex items-center border rounded-lg overflow-hidden bg-white ${getFieldBorder('ctx', formData.ctx)}`}>
                      <input
                        type="number"
                        step="10"
                        value={formData.ctx || ''}
                        onChange={(e) => setFormData({ ...formData, ctx: e.target.value })}
                        className="w-24 px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none text-right"
                      />
                      <span className="px-2.5 py-1.5 bg-slate-50 text-slate-500 font-medium text-[11px] border-l border-slate-200">
                        pg/mL
                      </span>
                    </div>
                    {getStatus('ctx', formData.ctx) === 'High' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">High</span>
                    )}
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
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-blue-900 hover:bg-blue-950 disabled:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Sparkles size={16} className="animate-spin text-blue-300" />
                      <span>Validating with AI & Initializing Case...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} className="text-blue-300" />
                      <span>Validate with AI & Initialize Case</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
}
