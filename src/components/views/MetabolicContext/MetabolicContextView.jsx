import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  Sparkles,
  Info,
} from 'lucide-react';
import { useBiomarkers, useTrendingData } from '../../../hooks';

const BIOMARKER_GROUPS = [
  {
    group: 'Serum Biomarkers',
    items: [
      { key: 'pth', label: 'Parathyroid Hormone (PTH)', sub: 'Serum Intact' },
      { key: 'vitaminD', label: '25-OH Vitamin D', sub: 'Total Serum' },
      { key: 'calcium', label: 'Calcium', sub: 'Total Serum' },
      { key: 'phosphate', label: 'Phosphate', sub: 'Inorganic' },
      { key: 'alp', label: 'Alkaline Phosphatase (ALP)', sub: 'Total Serum' },
    ],
  },
  {
    group: 'Bone Turnover Markers',
    items: [
      { key: 'ctx', label: 'CTX-I (C-Telopeptide)', sub: 'Bone Resorption Marker' },
      { key: 'p1np', label: 'P1NP', sub: 'Bone Formation Marker' },
    ],
  },
  {
    group: 'Thyroid Function',
    items: [
      { key: 'tsh', label: 'TSH', sub: 'Serum' },
      { key: 'free_t4', label: 'Free T4', sub: 'Serum' },
    ],
  },
  {
    group: 'Additional Minerals',
    items: [{ key: 'magnesium', label: 'Magnesium', sub: 'Serum' }],
  },
];

const DISPLAY = {
  elevated: {
    cls: 'biomarker-elevated',
    badge: 'status-badge-elevated',
    arrow: TrendingUp,
    arrowCls: 'text-red-600',
    label: 'Elevated',
  },
  deficient: {
    cls: 'biomarker-deficient',
    badge: 'status-badge-deficient',
    arrow: TrendingDown,
    arrowCls: 'text-amber-600',
    label: 'Deficient',
  },
  low: {
    cls: 'biomarker-low',
    badge: 'status-badge-low',
    arrow: TrendingDown,
    arrowCls: 'text-amber-600',
    label: 'Low',
  },
  normal: {
    cls: 'biomarker-normal',
    badge: 'status-badge-normal',
    arrow: Minus,
    arrowCls: 'text-teal-600',
    label: 'Normal',
  },
};

export default function MetabolicContextView({ patientId, onRunAssessment }) {
  const params = useParams();
  const navigate = useNavigate();
  const effectivePatientId = patientId || params.patientId || 'PEB-8842-A';
  const handleRunAssessment =
    onRunAssessment || (() => navigate(`/patients/${effectivePatientId}/assessment`));

  const { biomarkers, loading } = useBiomarkers(effectivePatientId);
  const { trendData } = useTrendingData(effectivePatientId);
  const [editable, setEditable] = useState({});

  if (loading || !biomarkers) {
    return <div className="p-10 text-center text-slate-500">Loading metabolic profile...</div>;
  }

  const renderTrendChart = (key, color) => {
    if (!trendData?.lastSixMonths) return null;
    const points = trendData.lastSixMonths;
    const values = points.map((p) => p[key]).filter((v) => v != null);
    if (values.length < 2) return null;
    const min = Math.min(...values) * 0.9;
    const max = Math.max(...values) * 1.05;
    const w = 320;
    const h = 60;
    const stepX = w / (values.length - 1);
    const coords = values.map((v, i) => {
      const x = i * stepX;
      const y = h - ((v - min) / (max - min)) * h;
      return [x, y];
    });
    const path = coords.map((c, i) => (i === 0 ? `M ${c[0]},${c[1]}` : `L ${c[0]},${c[1]}`)).join(' ');
    const areaPath = `${path} L ${w},${h} L 0,${h} Z`;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-14">
        <defs>
          <linearGradient id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#grad-${key})`} />
        <path d={path} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <circle key={i} cx={c[0]} cy={c[1]} r="3" fill="#fff" stroke={color} strokeWidth="2" />
        ))}
      </svg>
    );
  };

  const abnormalCount = Object.entries(biomarkers).filter(
    ([_, v]) => typeof v === 'object' && v.status && v.status !== 'normal'
  ).length;

  const panelDate = biomarkers.date;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">Metabolic Context</h2>
          <p className="text-slate-600 mt-1 text-base">
            Biochemical profile and endocrine status assessment for this patient.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-semibold">Panel Date</span>
            <span className="font-bold text-slate-900">{panelDate}</span>
          </div>
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
              abnormalCount > 0 ? 'bg-red-50 border-red-200' : 'bg-teal-50 border-teal-200'
            }`}
          >
            <AlertTriangle size={16} className={abnormalCount > 0 ? 'text-red-600' : 'text-teal-600'} />
            <span className={`font-bold ${abnormalCount > 0 ? 'text-red-700' : 'text-teal-700'}`}>
              {abnormalCount} abnormal {abnormalCount === 1 ? 'marker' : 'markers'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {BIOMARKER_GROUPS.map((grp, gi) => (
            <div key={gi} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-7 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">{grp.group}</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {grp.items.map((item) => {
                  const data = biomarkers[item.key];
                  if (!data) return null;
                  const d = DISPLAY[data.status] || DISPLAY.normal;
                  const Arrow = d.arrow;
                  const displayVal = editable[item.key] != null ? editable[item.key] : data.value;
                  return (
                    <div
                      key={item.key}
                      className={`biomarker-card ${d.cls} !rounded-none !border-0 !border-b border-slate-100 !p-6 transition`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-6">
                        <div className="flex-1 min-w-[240px]">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-bold text-slate-900 text-base">{item.label}</p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">{item.sub}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Arrow size={14} className={d.arrowCls} />
                              <span className={`status-badge ${d.badge} font-bold`}>{d.label}</span>
                            </div>
                          </div>

                          <div className="flex items-baseline gap-3 mt-3">
                            <input
                              type="number"
                              step="0.1"
                              value={displayVal}
                              onChange={(e) =>
                                setEditable((prev) => ({
                                  ...prev,
                                  [item.key]: parseFloat(e.target.value),
                                }))
                              }
                              className="w-28 bg-white/70 border border-slate-200 rounded-lg px-3 py-1.5 text-2xl font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                            />
                            <span className="text-sm text-slate-600 font-semibold">{data.unit}</span>
                            <span className="text-xs text-slate-400 font-medium ml-auto">
                              Ref: <span className="font-bold text-slate-600">{data.ref}</span>
                            </span>
                          </div>
                        </div>

                        <div className="w-full sm:w-80">
                          {renderTrendChart(
                            item.key,
                            data.status === 'elevated'
                              ? '#dc2626'
                              : data.status === 'low' || data.status === 'deficient'
                              ? '#f59e0b'
                              : '#10b981'
                          )}
                          {trendData?.lastSixMonths && (
                            <div className="flex justify-between text-[10px] font-semibold text-slate-400 mt-1">
                              <span>6 mo ago</span>
                              <span>Today</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <button
            onClick={handleRunAssessment}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold rounded-2xl hover:from-blue-700 hover:to-blue-800 transition shadow-xl shadow-blue-600/25 flex items-center justify-center gap-3 text-base border-2 border-dashed border-blue-300"
          >
            <Sparkles size={20} />
            Run Combined AI Assessment
            <ArrowRight size={18} />
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-extrabold text-slate-900">Historical Trend</h3>
              <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                Last 6 months
              </span>
            </div>

            <div className="space-y-5">
              {[
                { key: 'vitaminD', label: 'Vitamin D', unit: 'ng/mL', color: '#f59e0b', from: 24.2, to: 18.5, dir: 'down', note: '↓ Declining trend' },
                { key: 'pth', label: 'PTH', unit: 'pg/mL', color: '#dc2626', from: 68.5, to: 85.2, dir: 'up', note: '↑ Elevated — requires intervention' },
                { key: 'calcium', label: 'Calcium', unit: 'mg/dL', color: '#3b82f6', from: 8.8, to: 8.2, dir: 'down', note: '↓ Low — contributing to 2° HPT' },
                { key: 'ctx', label: 'CTX-I', unit: 'pg/mL', color: '#8b5cf6', from: 380, to: 450, dir: 'up', note: '↑ High bone resorption rate' },
              ].map((m) => (
                <div key={m.key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{m.label}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{m.unit}</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs text-slate-400 font-semibold">{m.from} →</span>
                      <span className="text-base font-black" style={{ color: m.color }}>{m.to}</span>
                    </div>
                  </div>
                  <div className="relative">{renderTrendChart(m.key, m.color)}</div>
                  <p
                    className={`text-[11px] font-bold flex items-center gap-1 ${
                      m.dir === 'up' ? 'text-red-600' : 'text-amber-600'
                    }`}
                  >
                    {m.dir === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {m.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`rounded-2xl border p-6 ${
              abnormalCount >= 3 ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div
                className={`w-10 h-10 rounded-xl ${
                  abnormalCount >= 3 ? 'bg-red-600' : 'bg-amber-500'
                } flex items-center justify-center text-white flex-shrink-0`}
              >
                <Info size={18} />
              </div>
              <h4 className="font-extrabold text-slate-900">Endocrine Pattern Detected</h4>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              Elevated PTH <span className="font-bold text-red-700">(85.2 pg/mL)</span> combined with low
              Vitamin D <span className="font-bold text-amber-700">(18.5 ng/mL)</span> and low Calcium
              <span className="font-bold text-amber-700"> (8.2 mg/dL)</span> is consistent with{' '}
              <span className="font-black bg-yellow-200 px-1.5 rounded">secondary hyperparathyroidism</span>,
              likely driven by vitamin D deficiency. Concurrent CTX elevation indicates increased bone turnover.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-5 text-xs text-slate-500 leading-relaxed">
            <span className="font-bold text-slate-700">Reference Ranges:</span> Values based on published
            clinical standards: PTH 15-65 pg/mL, 25-OH Vitamin D 30-100 ng/mL, Calcium 8.6-10.3 mg/dL,
            Phosphate 2.5-4.5 mg/dL, ALP 44-147 U/L, CTX &lt; 300 pg/mL, P1NP 15-80 mcg/L, TSH 0.4-4.0
            mIU/L, Free T4 0.8-1.8 ng/dL.
          </div>
        </div>
      </div>
    </div>
  );
}
